const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { Store, newId } = require('../../electron/store.cjs');
const { fixture, inventory } = require('../helpers/isolation-fixture.cjs');

test('mixed-results-save-restart; broken-active-keeps-requested-id', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(f.manifest, '{private synthetic excerpt');
  const before = await inventory(f.b.path);
  const registry = await fs.readFile(path.join(f.root, 'data/registry.json'));
  const state = await f.store.load();
  assert.equal(state.activeWorkspaceId, null);
  assert.equal(state.requestedActiveWorkspaceId, f.b.id);
  assert.equal(state.workspaces[0].status, 'ready');
  const fault = state.workspaces[1];
  assert.equal(fault.status, 'unavailable');
  assert.equal(fault.diagnostic.code, 'invalid-json');
  assert.ok(!JSON.stringify(fault).includes('private synthetic excerpt'));
  assert.ok(!JSON.stringify(fault).includes(f.b.path));
  const selected = await f.store.switchWorkspace(f.a.id);
  assert.equal(selected.status, 'selected');
  const d = f.a.documents[0];
  await f.store.saveDocument(f.a.id, d.id, d.title, '合成健康正文\n第二行', d.hash);
  const restart = new Store(path.join(f.root, 'data'));
  await restart.init();
  assert.equal(
    (await restart.load()).workspaces[0].workspace.documents[0].content,
    '合成健康正文\n第二行'
  );
  assert.deepEqual(await inventory(f.b.path), before);
  const initial = JSON.parse(registry);
  assert.deepEqual(restart.registry.workspaces, initial.workspaces);
});

for (const [name, damage, code] of [
  ['truncated', (f) => fs.writeFile(f.manifest, '{"version":'), 'invalid-json'],
  ['manifest', (f) => fs.rm(f.manifest), 'missing-manifest'],
  ['document', (f) => fs.rm(f.document), 'missing-document'],
  ['meta-dir', (f) => fs.rm(path.dirname(f.manifest), { recursive: true }), 'missing-manifest'],
  ['doc-dir', (f) => fs.rm(path.dirname(f.document), { recursive: true }), 'missing-document']
]) {
  test(`fault-matrix/read-retry-inventory: ${name}`, async (t) => {
    const f = await fixture(t);
    await damage(f);
    const before = await inventory(f.b.path);
    const registry = await fs.readFile(path.join(f.root, 'data/registry.json'));
    for (let i = 0; i < 2; i++) {
      const state = await f.store.load();
      assert.equal(state.workspaces[1].diagnostic.code, code);
    }
    assert.deepEqual(await inventory(f.b.path), before);
    assert.deepEqual(await fs.readFile(path.join(f.root, 'data/registry.json')), registry);
  });
}

test('all-mutations-refuse-fault before any workspace write', async (t) => {
  const f = await fixture(t);
  const d = f.b.documents[0];
  const sid = f.b.activeSessionId;
  const p = {
    id: newId(),
    docId: d.id,
    baseHash: d.hash,
    action: 'generate',
    text: '合成提案',
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  await f.store.addProposal(f.b.id, sid, p);
  await fs.rm(f.document);
  const before = await inventory(f.b.path);
  const operations = [
    () => f.store.saveDocument(f.b.id, d.id, d.title, '不能保存', d.hash),
    () => f.store.createDocument(f.b.id, '不能创建', 'chapter'),
    () => f.store.updateWorkspace(f.b.id, { target: 90000 }),
    () => f.store.createSession(f.b.id, '不能创建'),
    () => f.store.switchSession(f.b.id, sid),
    () => f.store.updateSession(f.b.id, sid, d.id, '不能保存'),
    () => f.store.addProposal(f.b.id, sid, { ...p, id: newId() }),
    () => f.store.resolveProposal(f.b.id, sid, p.id, true),
    () => f.store.resolveProposal(f.b.id, sid, p.id, false),
    () => f.store.restore(f.b.id, d.id, newId(), d.hash)
  ];
  for (const op of operations) await assert.rejects(f.store.serial(op));
  assert.deepEqual(await inventory(f.b.path), before);
});

test('switch-validates-before-commit and explicit repair/retry', async (t) => {
  const f = await fixture(t);
  await f.store.switchWorkspace(f.a.id);
  const registry = await fs.readFile(path.join(f.root, 'data/registry.json'));
  const original = await fs.readFile(f.manifest);
  await fs.writeFile(f.manifest, '{invalid');
  assert.equal((await f.store.switchWorkspace(f.b.id)).status, 'unavailable');
  assert.equal(f.store.registry.activeWorkspaceId, f.a.id);
  assert.deepEqual(await fs.readFile(path.join(f.root, 'data/registry.json')), registry);
  await fs.writeFile(f.manifest, original);
  assert.equal((await f.store.load()).workspaces[1].status, 'ready');
  assert.equal(f.store.registry.activeWorkspaceId, f.a.id);
  assert.equal((await f.store.switchWorkspace(f.b.id)).status, 'selected');
});

test('all-unavailable does not create, delete registration or select a replacement', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(f.manifest, '{invalid');
  await fs.rm(f.store.manifestPath(f.a.id));
  const before = await inventory(path.join(f.root, 'data'));
  const restart = new Store(path.join(f.root, 'data'));
  await restart.init();
  const state = await restart.load();
  assert.equal(state.activeWorkspaceId, null);
  assert.ok(state.workspaces.every((w) => w.status === 'unavailable'));
  assert.deepEqual(await inventory(path.join(f.root, 'data')), before);
});
