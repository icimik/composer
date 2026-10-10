const fs = require('node:fs/promises');
const { constants } = require('node:fs');
const path = require('node:path');
const { guardedFile } = require('../paths.cjs');
const { fail } = require('./format.cjs');

async function read(root, relative, limit, absent = false) {
  let handle;
  try {
    const file = await guardedFile(root, relative);
    handle = await fs.open(file, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
    const stat = await handle.stat();
    if (!stat.isFile()) fail('invalid-images');
    if (!Number.isSafeInteger(stat.size) || stat.size > limit) fail('stage-limit');
    const buffer = Buffer.alloc(stat.size);
    let position = 0;
    while (position < buffer.length) {
      const { bytesRead } = await handle.read(buffer, position, buffer.length - position, position);
      if (!bytesRead) fail('payload-mismatch');
      position += bytesRead;
    }
    const extra = await handle.read(Buffer.alloc(1), 0, 1, position);
    if (extra.bytesRead || (await handle.stat()).size !== stat.size) fail('payload-mismatch');
    return buffer;
  } catch (error) {
    if (absent && error.code === 'ENOENT') return null;
    throw error;
  } finally {
    if (handle) await handle.close();
  }
}
async function syncDirectory(root, relative) {
  const dir = await guardedFile(root, relative);
  // Windows does not expose the same directory-open/sync semantics. This is not a durability promise.
  if (process.platform === 'win32') return false;
  const handle = await fs.open(dir, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
  return true;
}
async function exclusive(root, relative, buffer) {
  const file = await guardedFile(root, relative, true);
  const handle = await fs.open(file, 'wx', 0o600);
  try {
    await handle.writeFile(buffer);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await syncDirectory(root, path.dirname(relative));
}
async function available(root) {
  const stat = await fs.statfs(root);
  const bytes = stat.bavail * stat.bsize;
  if (!Number.isSafeInteger(bytes) || bytes < 0) fail('space-limit');
  return bytes;
}
module.exports = { read, exclusive, syncDirectory, available };
