const path = require('node:path');
const { atomic, idSchema, kindSchema, workspaceSchema, folders } = require('./primitives.cjs');
const { guardedFile } = require('./paths.cjs');
const { readMeta, readWorkspace } = require('./reader.cjs');
const { unavailable } = require('./diagnostics.cjs');
const { persist } = require('./registry.cjs');
const { UserFacingError } = require('../errors.cjs');
module.exports = {
  async persistRegistry(next = this.registry) {
    await persist(this.root, next);
  },
  entry(wid) {
    idSchema.parse(wid);
    const entry = this.registry.workspaces.find((w) => w.id === wid);
    if (!entry) throw new UserFacingError('找不到此工作区。');
    return entry;
  },
  manifestPath(wid) {
    return path.join(this.entry(wid).path, '.composer', 'workspace.json');
  },
  async protectedFile(wid, relative, write = false) {
    return guardedFile(this.entry(wid).path, relative, write);
  },
  async meta(wid) {
    const entry = this.entry(wid);
    const meta = await readMeta(entry.path);
    if (meta.id !== wid) throw new UserFacingError('工作区信息或内部引用无效。');
    return meta;
  },
  async writableMeta(wid) {
    return workspaceSchema.parse(await this.workspace(wid));
  },
  async writeMeta(wid, data) {
    await atomic(
      await this.protectedFile(wid, '.composer/workspace.json', true),
      JSON.stringify(workspaceSchema.parse(data), null, 2)
    );
  },
  async docPath(wid, doc, write = false) {
    idSchema.parse(doc.id);
    kindSchema.parse(doc.kind);
    return guardedFile(this.entry(wid).path, `${folders[doc.kind]}/${doc.id}.md`, write);
  },
  async workspace(wid) {
    return readWorkspace(this.entry(wid));
  },
  async workspaceResult(wid) {
    const entry = this.entry(wid);
    try {
      return {
        status: 'ready',
        id: entry.id,
        name: entry.name,
        workspace: await this.workspace(wid)
      };
    } catch (error) {
      return unavailable(entry, error);
    }
  },
  async load() {
    const workspaces = await Promise.all(
      this.registry.workspaces.map((w) => this.workspaceResult(w.id))
    );
    const requestedActiveWorkspaceId = this.registry.activeWorkspaceId;
    const activeWorkspaceId = workspaces.some(
      (w) => w.id === requestedActiveWorkspaceId && w.status === 'ready'
    )
      ? requestedActiveWorkspaceId
      : null;
    return {
      workspaces,
      requestedActiveWorkspaceId,
      activeWorkspaceId,
      theme: this.registry.theme
    };
  }
};
