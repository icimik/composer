const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const disk = require('../../electron/store/revisions/disk.cjs');
const { setup } = require('../helpers/revision-disk-fixture.cjs');
for (const kind of ['save', 'restore', 'accept']) {
  test(`disk revision ${kind} installs coherent resources and repeated recovery is idempotent`, async (t) => {
    const { root, f, plan, targets } = await setup(t, kind);
    await disk.execute(root, plan, f.policy);
    for (const [key, relative] of Object.entries(targets))
      assert.ok((await fs.readFile(path.join(root, relative))).equals(plan.images[key].after));
    assert.equal((await disk.preview(root, 'operation-a', f.policy)).action, 'cleanup-complete');
    await disk.recover(root, 'operation-a', f.policy);
    assert.ok((await fs.readFile(path.join(root, targets.audit))).equals(plan.images.audit.after));
  });
}
for (const boundary of ['prepared', 'commit', 'installed:manuscript', 'installed:manifest']) {
  test(`interruption at ${boundary} retains journal for explicit validated recovery`, async (t) => {
    const { root, f, plan, targets } = await setup(t);
    await assert.rejects(
      disk.execute(root, plan, f.policy, async (phase) => {
        if (phase === boundary) throw Object.assign(new Error('Injected'), { code: 'EIO' });
      })
    );
    const before = await fs.readFile(path.join(root, targets.manuscript));
    const view = await disk.preview(root, 'operation-a', f.policy);
    assert.ok((await fs.readFile(path.join(root, targets.manuscript))).equals(before));
    if (boundary === 'prepared') {
      assert.equal(view.action, 'cleanup-prepared');
      await assert.rejects(disk.recover(root, 'operation-a', f.policy));
    } else {
      assert.equal(view.action, 'roll-forward');
      await disk.recover(root, 'operation-a', f.policy);
      assert.ok(
        (await fs.readFile(path.join(root, targets.manuscript))).equals(
          plan.images.manuscript.after
        )
      );
    }
  });
}
test('third target values and unknown journal files fail closed', async (t) => {
  const { root, f, plan, targets } = await setup(t);
  await assert.rejects(
    disk.execute(root, plan, f.policy, async (phase) => {
      if (phase === 'commit') throw new Error('Injected');
    })
  );
  await fs.writeFile(path.join(root, targets.manuscript), 'External author input');
  assert.equal((await disk.preview(root, 'operation-a', f.policy)).action, 'conflict');
  await assert.rejects(disk.recover(root, 'operation-a', f.policy));
  assert.equal(
    await fs.readFile(path.join(root, targets.manuscript), 'utf8'),
    'External author input'
  );
  const journal = path.join(root, '.composer/transactions/operation-a');
  await fs.writeFile(path.join(journal, 'unknown'), 'keep');
  await assert.rejects(disk.preview(root, 'operation-a', f.policy));
});
test('journal payload symlink never follows an external target', async (t) => {
  const { root, f, plan, targets } = await setup(t);
  await assert.rejects(
    disk.execute(root, plan, f.policy, async (phase) => {
      if (phase === 'commit') throw new Error('Injected');
    })
  );
  const journal = path.join(root, '.composer/transactions/operation-a');
  await fs.rm(path.join(journal, 'manuscript.after'));
  try {
    await fs.symlink(path.join(root, targets.manuscript), path.join(journal, 'manuscript.after'));
  } catch (error) {
    if (process.platform === 'win32' && error.code === 'EPERM') {
      t.skip('Windows symlink privilege unavailable');
      return;
    }
    throw error;
  }
  await assert.rejects(disk.preview(root, 'operation-a', f.policy));
  assert.ok(
    (await fs.readFile(path.join(root, targets.manuscript))).equals(plan.images.manuscript.before)
  );
});
