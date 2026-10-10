const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { Store } = require('../../electron/store.cjs');
const { fixture } = require('../helpers/isolation-fixture.cjs');

for (const code of ['EACCES', 'ENOENT']) {
  test(`existing index ${code} read failure is global, not absent-index initialization`, async (t) => {
    const f = await fixture(t);
    const file = path.join(f.root, 'data/registry.json');
    const original = await fs.readFile(file);
    const read = fs.readFile;
    const mocked = t.mock.method(fs, 'readFile', async (target, ...args) => {
      if (target === file) throw Object.assign(new Error('private index detail'), { code });
      return read(target, ...args);
    });
    await assert.rejects(new Store(path.join(f.root, 'data')).init(), /索引/);
    mocked.mock.restore();
    assert.deepEqual(await fs.readFile(file), original);
  });
}

test('dangling index symlink is not treated as a missing registry', async (t) => {
  const f = await fixture(t);
  if (process.platform === 'win32') {
    t.skip('requires symlink privilege');
    return;
  }
  const file = path.join(f.root, 'data/registry.json');
  await fs.rm(file);
  const outside = path.join(f.root, 'not-created.json');
  await fs.symlink(outside, file);
  await assert.rejects(new Store(path.join(f.root, 'data')).init(), /索引/);
  assert.ok((await fs.lstat(file)).isSymbolicLink());
  await assert.rejects(fs.access(outside));
});
