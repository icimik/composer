const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { Store } = require('../../electron/store.cjs');
const { fixture, inventory } = require('../helpers/isolation-fixture.cjs');

for (const code of ['EACCES', 'EPERM', 'EIO', 'CUSTOM']) {
  test(`deterministic read fault ${code} preserves failed data and refuses writes`, async (t) => {
    const f = await fixture(t);
    const before = await inventory(path.join(f.root, 'data'));
    const read = fs.readFile;
    const mocked = t.mock.method(fs, 'readFile', async (file, ...args) => {
      if (file === f.manifest) throw Object.assign(new Error('private mock exception'), { code });
      return read(file, ...args);
    });
    const state = await f.store.load();
    const expected = ['EACCES', 'EPERM'].includes(code)
      ? 'read-denied'
      : code === 'EIO'
        ? 'read-failed'
        : 'unknown';
    assert.equal(state.workspaces[1].diagnostic.code, expected);
    assert.equal(state.workspaces[0].status, 'ready');
    await assert.rejects(f.store.updateWorkspace(f.b.id, { target: 90000 }));
    assert.ok(!JSON.stringify(state.workspaces[1]).includes('private mock'));
    mocked.mock.restore();
    assert.deepEqual(await inventory(path.join(f.root, 'data')), before);
  });
}

test('parent symlink/path escape and open candidate fail closed without creating outside directories', async (t) => {
  const f = await fixture(t);
  if (process.platform === 'win32') {
    t.skip('requires symlink privilege');
    return;
  }
  const outside = path.join(f.root, 'outside');
  await fs.mkdir(outside);
  await fs.rm(path.join(f.b.path, '.composer'), { recursive: true });
  await fs.symlink(outside, path.join(f.b.path, '.composer'));
  const before = await inventory(outside);
  const registry = await fs.readFile(path.join(f.root, 'data/registry.json'));
  assert.equal((await f.store.load()).workspaces[1].diagnostic.code, 'unsafe-path');
  await assert.rejects(f.store.protectedFile(f.b.id, '../../escape', true), /安全/);
  await assert.rejects(f.store.openWorkspace(f.b.path), /安全/);
  assert.deepEqual(await inventory(outside), before);
  assert.deepEqual(await fs.readFile(path.join(f.root, 'data/registry.json')), registry);
});

test('invalid referential/identity metadata is a fault, not a fake empty workspace', async (t) => {
  const f = await fixture(t);
  const original = JSON.parse(await fs.readFile(f.manifest, 'utf8'));
  const mutations = [
    (m) => {
      m.id = 'wrong-id';
    },
    (m) => {
      m.activeSessionId = 'missing';
    },
    (m) => {
      m.sessions[0].documentId = 'missing';
    },
    (m) => {
      m.documents.push(m.documents[0]);
    },
    (m) => {
      m.sessions.push(m.sessions[0]);
    },
    (m) => {
      m.version = 2;
    }
  ];
  for (const mutate of mutations) {
    const meta = structuredClone(original);
    mutate(meta);
    await fs.writeFile(f.manifest, JSON.stringify(meta));
    assert.equal((await f.store.load()).workspaces[1].diagnostic.code, 'invalid-manifest');
  }
});

test('registry persistence failure cannot commit an active selection in memory or disk', async (t) => {
  const f = await fixture(t);
  const before = await fs.readFile(path.join(f.root, 'data/registry.json'));
  const rename = fs.rename;
  t.mock.method(fs, 'rename', async (from, to) => {
    if (to.endsWith('registry.json')) throw Object.assign(new Error('private'), { code: 'EIO' });
    return rename(from, to);
  });
  await assert.rejects(f.store.switchWorkspace(f.a.id), /索引/);
  assert.equal(f.store.registry.activeWorkspaceId, f.b.id);
  assert.deepEqual(await fs.readFile(path.join(f.root, 'data/registry.json')), before);
});

test('untrustworthy registry is never silently reset', async (t) => {
  const f = await fixture(t);
  const file = path.join(f.root, 'data/registry.json');
  const base = structuredClone(f.store.registry);
  const values = [
    null,
    { ...base, workspaces: [base.workspaces[0], base.workspaces[0]] },
    { ...base, workspaces: [{ ...base.workspaces[0], path: '../escape' }] }
  ];
  for (const value of values) {
    await fs.writeFile(file, JSON.stringify(value));
    const before = await fs.readFile(file);
    await assert.rejects(new Store(path.join(f.root, 'data')).init(), /索引/);
    assert.deepEqual(await fs.readFile(file), before);
  }
});

test('missing optional history read is pure', async (t) => {
  const f = await fixture(t);
  const before = await inventory(f.a.path);
  assert.deepEqual(await f.store.history(f.a.id, f.a.documents[0].id), []);
  assert.deepEqual(await inventory(f.a.path), before);
});

test('synthetic 64-document readiness preflight measurement', async (t) => {
  const f = await fixture(t);
  for (let i = 1; i < 64; i++) await f.store.createDocument(f.a.id, `合成 ${i}`, 'chapter');
  const start = performance.now();
  const w = await f.store.workspace(f.a.id);
  const readMs = performance.now() - start;
  const saveStart = performance.now();
  await f.store.saveDocument(
    f.a.id,
    w.documents[0].id,
    w.documents[0].title,
    '合成测量',
    w.documents[0].hash
  );
  t.diagnostic(
    `64 synthetic docs: readiness=${readMs.toFixed(1)}ms; guarded save=${(performance.now() - saveStart).toFixed(1)}ms`
  );
});
