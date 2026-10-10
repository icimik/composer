const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { fixture, inventory } = require('../helpers/isolation-fixture.cjs');

test('explicit creation cannot replace a registered faulty or missing root', async (t) => {
  const f = await fixture(t);
  await fs.rm(f.manifest);
  const before = await inventory(f.b.path);
  await assert.rejects(f.store.createWorkspace('不能替换 B', f.b.path), /已登记/);
  assert.deepEqual(await inventory(f.b.path), before);
  await fs.rm(f.b.path, { recursive: true });
  await assert.rejects(f.store.createWorkspace('不能重建 B', f.b.path), /已登记/);
  await assert.rejects(fs.access(f.b.path));
});

test('create refuses unsafe existing internal directories before creating files outside root', async (t) => {
  const f = await fixture(t);
  if (process.platform === 'win32') {
    t.skip('requires symlink privilege');
    return;
  }
  const candidate = path.join(f.root, 'candidate');
  const outside = path.join(f.root, 'outside');
  await fs.mkdir(candidate);
  await fs.mkdir(outside);
  await fs.symlink(outside, path.join(candidate, '.composer'));
  await assert.rejects(f.store.createWorkspace('不能创建', candidate), /安全/);
  assert.deepEqual(await fs.readdir(outside), []);
});
