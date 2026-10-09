// Pre-fix characterization only. Run explicitly; not a capability acceptance test.
const assert = require('node:assert/strict');
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

async function fixture(run) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'composer-isolation-probe-'));
  try {
    const store = new Store(root);
    await store.init();
    const a = (await store.load()).workspaces[0];
    const state = await store.createWorkspace('合成故障作品 B');
    const b = state.workspaces.find((w) => w.id !== a.id);
    const manifest = store.manifestPath(b.id);
    const document = await store.docPath(b.id, b.documents[0]);
    await run({ store, root, a, b, manifest, document });
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function main() {
  const faults = [
    ['invalid-json', async ({ manifest }) => fs.writeFile(manifest, '{invalid')],
    ['truncated-json', async ({ manifest }) => fs.writeFile(manifest, '{"version":1,')],
    ['missing-manifest', async ({ manifest }) => fs.rm(manifest)],
    ['missing-document', async ({ document }) => fs.rm(document)],
    [
      'missing-manifest-directory',
      async ({ b }) => fs.rm(path.join(b.path, '.composer'), { recursive: true })
    ],
    [
      'missing-document-directory',
      async ({ b }) => fs.rm(path.join(b.path, '07-writing/chapters'), { recursive: true })
    ]
  ];
  for (const [name, damage] of faults) {
    await fixture(async (f) => {
      await damage(f);
      const before = await inventory(f.b.path);
      const registry = await fs.readFile(path.join(f.root, 'registry.json'));
      await assert.rejects(f.store.load());
      await f.store.workspace(f.a.id);
      const after = await inventory(f.b.path);
      const createsDirectory = name.endsWith('-directory');
      if (createsDirectory) assert.notDeepEqual(after, before);
      else assert.deepEqual(after, before);
      assert.deepEqual(await fs.readFile(path.join(f.root, 'registry.json')), registry);
      const saved = await f.store.saveDocument(
        f.a.id,
        f.a.documents[0].id,
        '合成 A',
        '合成健康正文',
        f.a.documents[0].hash
      );
      const restart = new Store(f.root);
      await restart.init();
      await assert.rejects(restart.load());
      assert.equal((await restart.workspace(f.a.id)).documents[0].hash, saved.hash);
      console.log(
        `${name}: aggregate load/restart rejects; direct A save survives; read mkdir=${createsDirectory}`
      );
    });
  }
  await fixture(async (f) => {
    const before = await inventory(f.b.path);
    const registry = await fs.readFile(path.join(f.root, 'registry.json'));
    const readFile = fs.readFile;
    fs.readFile = async (file, ...args) => {
      if (file === f.manifest)
        throw Object.assign(new Error('synthetic private detail'), { code: 'EACCES' });
      return readFile(file, ...args);
    };
    try {
      await assert.rejects(f.store.load(), { code: 'EACCES' });
    } finally {
      fs.readFile = readFile;
    }
    assert.deepEqual(await inventory(f.b.path), before);
    assert.deepEqual(await fs.readFile(path.join(f.root, 'registry.json')), registry);
    console.log('read-error: deterministic EACCES rejects aggregate; no platform permission claim');
  });
  await fixture(async (f) => {
    await f.store.switchWorkspace(f.a.id);
    await fs.writeFile(f.manifest, '{invalid');
    const before = await inventory(f.b.path);
    await assert.rejects(f.store.switchWorkspace(f.b.id));
    const registry = JSON.parse(await fs.readFile(path.join(f.root, 'registry.json'), 'utf8'));
    assert.equal(registry.activeWorkspaceId, f.b.id);
    assert.deepEqual(await inventory(f.b.path), before);
    console.log('failed-switch: persisted active ID changes to broken B before validation');
  });
  await fixture(async (f) => {
    await fs.rm(f.document);
    const before = await inventory(f.b.path);
    await assert.rejects(f.store.workspace(f.b.id));
    await f.store.updateWorkspace(f.b.id, { target: 90000 }).catch(() => {});
    assert.notDeepEqual(await inventory(f.b.path), before);
    assert.equal(JSON.parse(await fs.readFile(f.manifest, 'utf8')).target, 90000);
    console.log('failed-write-guard: unreadable B manifest mutation commits before return rejects');
  });
  await fixture(async (f) => {
    await fs.writeFile(f.manifest, '{invalid');
    await fs.writeFile(f.store.manifestPath(f.a.id), '{invalid');
    await assert.rejects(f.store.load());
    console.log('all-failed: aggregate rejects without independent diagnostics');
  });
  await fixture(async (f) => {
    const file = path.join(f.root, 'registry.json');
    await fs.writeFile(file, '{invalid');
    const before = await fs.readFile(file);
    await assert.rejects(new Store(f.root).init(), /索引损坏/);
    assert.deepEqual(await fs.readFile(file), before);
    console.log(
      'global-registry: existing corrupt JSON fail-closed and byte preservation confirmed'
    );
  });
}

if (require.main === module)
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { fixture, inventory };
