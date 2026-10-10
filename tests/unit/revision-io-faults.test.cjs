const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const disk = require('../../electron/store/revisions/disk.cjs');
const { setup, inventory } = require('../helpers/revision-disk-fixture.cjs');
const { resourcePolicy } = require('../../electron/store/revisions/resource-policy.cjs');

test('resource allocation is explicit, bounded, and low space refuses before creating staging', async (t) => {
  assert.deepEqual(resourcePolicy, { maxStagedBytes: 268435456, minFreeBytes: 268435456 });
  assert.ok(Object.isFrozen(resourcePolicy));
  const { root, f, plan } = await setup(t);
  const before = await inventory(root);
  const original = fs.statfs;
  fs.statfs = async () => ({ bavail: 0, bsize: 4096 });
  t.after(() => {
    fs.statfs = original;
  });
  await assert.rejects(disk.execute(root, plan, f.policy), (e) => e.code === 'space-limit');
  assert.deepEqual(await inventory(root), before);
});
for (const fault of ['EACCES', 'ENOSPC', 'EIO']) {
  test(`deterministic ${fault} on installation preserves evidence and permits later explicit recovery`, async (t) => {
    const { root, f, plan, targets } = await setup(t);
    const original = fs.open;
    fs.open = async (file, ...args) => {
      if (String(file).startsWith(root) && String(file).endsWith('.revision.tmp'))
        throw Object.assign(new Error('synthetic private path'), { code: fault });
      return original(file, ...args);
    };
    t.after(() => {
      fs.open = original;
    });
    await assert.rejects(
      disk.execute(root, plan, f.policy),
      (e) => e.code === 'io-failure' && !e.message.includes('private')
    );
    assert.ok(
      (await fs.readFile(path.join(root, targets.manuscript))).equals(plan.images.manuscript.before)
    );
    fs.open = original;
    assert.equal((await disk.preview(root, 'operation-a', f.policy)).action, 'roll-forward');
    await disk.recover(root, 'operation-a', f.policy);
    assert.ok(
      (await fs.readFile(path.join(root, targets.manuscript))).equals(plan.images.manuscript.after)
    );
  });
}
test('a target changed after an earlier installation prevents complete acknowledgment', async (t) => {
  const { root, f, plan, targets } = await setup(t);
  await assert.rejects(
    disk.execute(root, plan, f.policy, async (phase) => {
      if (phase === 'installed:audit')
        await fs.writeFile(path.join(root, targets.manuscript), 'External changed again');
    }),
    (e) => e.code === 'payload-mismatch'
  );
  assert.equal((await disk.preview(root, 'operation-a', f.policy)).action, 'conflict');
  await assert.rejects(
    fs.access(path.join(root, '.composer/transactions/operation-a/complete.json'))
  );
  assert.equal(
    await fs.readFile(path.join(root, targets.manuscript), 'utf8'),
    'External changed again'
  );
});
test('reused scratch is flushed again after a prior file-sync failure', async (t) => {
  const { root, f, plan } = await setup(t);
  const original = fs.open;
  let denySync = true;
  let scratchSyncs = 0;
  fs.open = async (file, ...args) => {
    const handle = await original(file, ...args);
    if (
      String(file).startsWith(root) &&
      String(file).endsWith('document-a.md.operation-a.revision.tmp')
    ) {
      const sync = handle.sync.bind(handle);
      handle.sync = async () => {
        scratchSyncs++;
        if (denySync) throw Object.assign(new Error('Injected sync'), { code: 'EIO' });
        return sync();
      };
    }
    return handle;
  };
  t.after(() => {
    fs.open = original;
  });
  await assert.rejects(disk.execute(root, plan, f.policy));
  denySync = false;
  await disk.recover(root, 'operation-a', f.policy);
  assert.ok(scratchSyncs >= 2, 'residual scratch must be synchronized before rename');
});
