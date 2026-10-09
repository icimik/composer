const fs = require('node:fs/promises');
const path = require('node:path');
const { z } = require('zod');
const {
  atomic,
  hash,
  newId,
  idSchema,
  nameSchema,
  contentSchema,
  kindSchema,
  proposalSchema,
  workspaceSchema,
  folders
} = require('./primitives.cjs');
module.exports = {
  async persistRegistry() {
    await atomic(path.join(this.root, 'registry.json'), JSON.stringify(this.registry, null, 2));
  },
  entry(wid) {
    idSchema.parse(wid);
    const e = this.registry.workspaces.find((w) => w.id === wid);
    if (!e) throw new Error('找不到此工作区。');
    return e;
  },
  manifestPath(wid) {
    return path.join(this.entry(wid).path, '.composer', 'workspace.json');
  },
  async protectedFile(wid, relative) {
    const root = await fs.realpath(this.entry(wid).path);
    const file = path.join(root, relative);
    await fs.mkdir(path.dirname(file), { recursive: true });
    const dir = await fs.realpath(path.dirname(file));
    if (!dir.startsWith(root + path.sep)) throw new Error('内部目录不可指向工作区以外。');
    try {
      if ((await fs.lstat(file)).isSymbolicLink())
        throw new Error('不允许通过符号链接访问工作区内部文件。');
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    return file;
  },
  async meta(wid) {
    return workspaceSchema.parse(
      JSON.parse(
        await fs.readFile(await this.protectedFile(wid, '.composer/workspace.json'), 'utf8')
      )
    );
  },
  async writeMeta(wid, data) {
    await atomic(
      await this.protectedFile(wid, '.composer/workspace.json'),
      JSON.stringify(workspaceSchema.parse(data), null, 2)
    );
  },
  async docPath(wid, doc) {
    idSchema.parse(doc.id);
    kindSchema.parse(doc.kind);
    const root = await fs.realpath(this.entry(wid).path);
    const file = path.join(root, folders[doc.kind], `${doc.id}.md`);
    const dir = path.dirname(file);
    await fs.mkdir(dir, { recursive: true });
    const real = await fs.realpath(dir);
    if (!real.startsWith(root + path.sep)) throw new Error('文稿目录不可指向工作区以外。');
    try {
      const stat = await fs.lstat(file);
      if (stat.isSymbolicLink()) throw new Error('不允许通过符号链接读写文稿。');
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    return file;
  },
  async workspace(wid) {
    const meta = await this.meta(wid);
    const documents = await Promise.all(
      meta.documents.map(async (d) => {
        const content = await fs.readFile(await this.docPath(wid, d), 'utf8');
        return { ...d, content, hash: hash(content) };
      })
    );
    return { ...meta, path: this.entry(wid).path, documents };
  },
  async load() {
    return {
      ...this.registry,
      workspaces: await Promise.all(this.registry.workspaces.map((w) => this.workspace(w.id)))
    };
  }
};
