const fs = require('node:fs/promises');
const path = require('node:path');
const { WorkspaceFault } = require('./diagnostics.cjs');

async function guardedFile(root, relative, write = false) {
  if (!path.isAbsolute(root) || path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..'))
    throw new WorkspaceFault('unsafe-path');
  const rootStat = await fs.lstat(root);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) throw new WorkspaceFault('unsafe-path');
  const canonical = await fs.realpath(root);
  if (canonical !== path.resolve(root)) throw new WorkspaceFault('unsafe-path');
  const file = path.resolve(canonical, relative);
  if (!file.startsWith(canonical + path.sep)) throw new WorkspaceFault('unsafe-path');
  const parts = path.relative(canonical, file).split(path.sep);
  let current = canonical;
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    const parent = index < parts.length - 1;
    let stat;
    try {
      stat = await fs.lstat(current);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (!parent) return file;
      if (!write) throw error;
      await fs.mkdir(current);
      stat = await fs.lstat(current);
    }
    if (stat.isSymbolicLink()) throw new WorkspaceFault('unsafe-path');
    if (parent && !stat.isDirectory()) throw new WorkspaceFault('unsafe-path');
    const real = await fs.realpath(current);
    if (!real.startsWith(canonical + path.sep)) throw new WorkspaceFault('unsafe-path');
  }
  return file;
}
module.exports = { guardedFile };
