const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { fixture, inventory } = require('../helpers/isolation-fixture.cjs');

for (const folder of ['transactions', 'transaction-cleanup']) {
  test(`pending ${folder} is unavailable, isolated and refuses every regular write`, async (t) => {
    const f = await fixture(t);
    const dir = path.join(f.a.path, '.composer', folder, 'operation-a');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'intent.json'), '{invalid synthetic evidence');
    const before = await inventory(f.a.path);
    const loaded = await f.store.load();
    const a = loaded.workspaces.find((w) => w.id === f.a.id);
    assert.equal(a.status, 'unavailable');
    assert.equal(a.diagnostic.code, 'revision-recovery-required');
    assert.equal(loaded.workspaces.find((w) => w.id === f.b.id).status, 'ready');
    const d = f.a.documents[0];
    for (const attempt of [
      () => f.store.saveDocument(f.a.id, d.id, d.title, 'No write', d.hash),
      () => f.store.createDocument(f.a.id, 'No write', 'chapter'),
      () => f.store.updateSession(f.a.id, f.a.activeSessionId, d.id, 'No write')
    ])
      await assert.rejects(attempt(), (e) => e.code === 'revision-recovery-required');
    assert.deepEqual(await inventory(f.a.path), before);
    await f.store.saveDocument(f.b.id, f.b.documents[0].id, 'Healthy', 'Healthy content', d.hash);
    assert.deepEqual(await inventory(f.a.path), before);
  });
}
