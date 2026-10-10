const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const disk = require('../../electron/store/revisions/disk.cjs');
const { cleanup } = require('../../electron/store/revisions/cleanup.cjs');
const { setup, inventory } = require('../helpers/revision-disk-fixture.cjs');

async function retire(t) {
  const f = await setup(t);
  await disk.execute(f.root, f.plan, f.f.policy);
  await assert.rejects(
    cleanup(f.root, 'operation-a', f.f.policy, async (phase) => {
      if (phase === 'cleanup:retired') throw new Error('Retained fixture');
    })
  );
  return { ...f, dir: path.join(f.root, '.composer/transaction-cleanup/operation-a') };
}
for (const fault of ['EACCES', 'ENOSPC', 'EIO']) {
  test(`cleanup ${fault} keeps validated remaining evidence and explicit retry finishes`, async (t) => {
    const { root, f, dir } = await retire(t);
    const before = await inventory(root);
    const original = fs.unlink;
    fs.unlink = async (file) => {
      if (file.startsWith(dir)) throw Object.assign(new Error('Private details'), { code: fault });
      return original(file);
    };
    t.after(() => {
      fs.unlink = original;
    });
    await assert.rejects(
      cleanup(root, 'operation-a', f.policy),
      (e) => e.code === 'io-failure' && !e.message.includes('Private')
    );
    assert.deepEqual(await inventory(root), before);
    fs.unlink = original;
    assert.equal((await cleanup(root, 'operation-a', f.policy)).status, 'cleaned');
  });
}
for (const damage of ['unknown-file', 'changed-payload', 'invalid-intent', 'hardlink']) {
  test(`retired cleanup refuses ${damage} before any deletion`, async (t) => {
    const { root, f, dir } = await retire(t);
    if (damage === 'unknown-file') await fs.writeFile(path.join(dir, 'author.md'), 'Unknown text');
    if (damage === 'changed-payload')
      await fs.writeFile(path.join(dir, 'manifest.before'), 'Third value');
    if (damage === 'invalid-intent') await fs.writeFile(path.join(dir, 'intent.json'), '{');
    if (damage === 'hardlink')
      await fs.link(path.join(dir, 'manuscript.before'), path.join(root, 'linked.md'));
    const before = await inventory(root);
    await assert.rejects(cleanup(root, 'operation-a', f.policy));
    assert.deepEqual(await inventory(root), before);
  });
}
test('retired symlink fails closed without touching its target', async (t) => {
  const { root, f, dir } = await retire(t);
  const file = path.join(dir, 'manuscript.before');
  const outside = path.join(root, 'external.md');
  await fs.writeFile(outside, 'External bytes');
  await fs.unlink(file);
  try {
    await fs.symlink(outside, file);
  } catch (error) {
    if (process.platform !== 'win32' || !['EPERM', 'EACCES'].includes(error.code)) throw error;
    t.skip('Native symlink privilege unavailable');
    return;
  }
  const before = await inventory(root);
  await assert.rejects(cleanup(root, 'operation-a', f.policy));
  assert.deepEqual(await inventory(root), before);
});
test('cleanup rechecks a changed payload after partial deletion without deleting unknown bytes', async (t) => {
  const { root, f, dir } = await retire(t);
  await assert.rejects(
    cleanup(root, 'operation-a', f.policy, async (phase) => {
      if (phase === 'before-clean:manuscript.before')
        await fs.writeFile(path.join(dir, 'manuscript.before'), 'Third!');
    }),
    (e) => e.code === 'payload-mismatch'
  );
  assert.equal(await fs.readFile(path.join(dir, 'manuscript.before'), 'utf8'), 'Third!');
});
test('multiple active operations are ambiguous and cleanup preserves all evidence', async (t) => {
  const { root, f, plan } = await setup(t);
  await disk.execute(root, plan, f.policy);
  await fs.mkdir(path.join(root, '.composer/transactions/operation-other'));
  const before = await inventory(root);
  await assert.rejects(cleanup(root, 'operation-a', f.policy), (e) => e.code === 'invalid-intent');
  assert.deepEqual(await inventory(root), before);
  assert.ok((await fs.readdir(path.join(root, '.composer/transactions'))).includes('operation-a'));
});
test('active plus retired operations are ambiguous and cleanup preserves all evidence', async (t) => {
  const { root, f } = await retire(t);
  await fs.mkdir(path.join(root, '.composer/transactions/operation-other'));
  const before = await inventory(root);
  await assert.rejects(cleanup(root, 'operation-a', f.policy), (e) => e.code === 'invalid-intent');
  assert.deepEqual(await inventory(root), before);
});
test('cleanup rejects traversal identities without modifying inventory', async (t) => {
  const { root, f } = await retire(t);
  const before = await inventory(root);
  await assert.rejects(
    cleanup(root, '../operation-a', f.policy),
    (e) => e.code === 'invalid-intent'
  );
  assert.deepEqual(await inventory(root), before);
});
test('unknown active files prevent retirement', async (t) => {
  const { root, f, plan } = await setup(t);
  await disk.execute(root, plan, f.policy);
  await fs.writeFile(
    path.join(root, '.composer/transactions/operation-a/unknown.md'),
    'Author bytes'
  );
  const before = await inventory(root);
  await assert.rejects(cleanup(root, 'operation-a', f.policy), (e) => e.code === 'invalid-intent');
  assert.deepEqual(await inventory(root), before);
});
test('directory sync failure after deletion leaves a resumable retired inventory', async (t) => {
  if (process.platform === 'win32') {
    t.skip('Windows directory synchronization is explicitly unsupported by this adapter');
    return;
  }
  const { root, f, dir } = await retire(t);
  const original = fs.open;
  let deny = true;
  fs.open = async (file, ...args) => {
    const handle = await original(file, ...args);
    if (file === dir) {
      const sync = handle.sync.bind(handle);
      handle.sync = async () => {
        if (deny) throw Object.assign(new Error('Injected directory sync'), { code: 'EIO' });
        return sync();
      };
    }
    return handle;
  };
  t.after(() => {
    fs.open = original;
  });
  await assert.rejects(cleanup(root, 'operation-a', f.policy), (e) => e.code === 'io-failure');
  assert.ok((await fs.readdir(dir)).includes('intent.json'));
  deny = false;
  assert.equal((await cleanup(root, 'operation-a', f.policy)).status, 'cleaned');
});
