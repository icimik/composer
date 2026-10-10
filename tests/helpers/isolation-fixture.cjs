const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Store, hash } = require('../../electron/store.cjs');

async function inventory(root) {
  const result = {};
  async function visit(dir) {
    for (const item of await fs.readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name);
      const relative = path.relative(root, file);
      if (item.isDirectory()) {
        result[relative] = 'directory';
        await visit(file);
      } else if (item.isSymbolicLink()) result[relative] = `link:${await fs.readlink(file)}`;
      else result[relative] = hash(await fs.readFile(file));
    }
  }
  await visit(root);
  return result;
}

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'composer-isolation-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const store = new Store(path.join(root, 'data'));
  await store.init();
  const a = await store.workspace(store.registry.activeWorkspaceId);
  await store.createWorkspace('合成作品 B');
  const b = await store.workspace(store.registry.activeWorkspaceId);
  return {
    store,
    root,
    a,
    b,
    manifest: store.manifestPath(b.id),
    document: await store.docPath(b.id, b.documents[0])
  };
}
module.exports = { fixture, inventory };
