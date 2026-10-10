const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { setup, inventory } = require('../helpers/revision-disk-fixture.cjs');
const disk = require('../../electron/store/revisions/disk.cjs');

const resources = ['manuscript', 'manifest', 'history', 'audit'];
const phases = [
  ...resources.flatMap((kind) => ['before', 'after'].map((side) => `staged:${kind}:${side}`)),
  'prepared',
  'before:commit',
  'commit',
  ...resources.flatMap((kind) => [`scratch:${kind}`, `installed:${kind}`]),
  'before:complete',
  'complete'
];
for (const kind of ['save', 'restore', 'accept']) {
  for (const phase of phases) {
    test(`${kind}: real child exit at ${phase} never triggers diagnostic writes`, async (t) => {
      const { root, nonce, f, plan, targets } = await setup(t, kind);
      const result = spawnSync(
        process.execPath,
        [path.resolve('tests/helpers/revision-disk-child.cjs'), root, nonce, kind, phase],
        { timeout: 10000, encoding: 'utf8' }
      );
      assert.equal(result.status, 77, `status=${result.status}, signal=${result.signal}`);
      const beforePreview = await inventory(root);
      if (phase.startsWith('staged:')) {
        await assert.rejects(disk.preview(root, 'operation-a', f.policy));
        assert.deepEqual(await inventory(root), beforePreview);
        return;
      }
      const view = await disk.preview(root, 'operation-a', f.policy);
      assert.deepEqual(await inventory(root), beforePreview);
      if (phase === 'prepared' || phase === 'before:commit') {
        assert.equal(view.action, 'cleanup-prepared');
        await assert.rejects(disk.recover(root, 'operation-a', f.policy));
        return;
      }
      assert.ok(['roll-forward', 'cleanup-complete'].includes(view.action));
      await disk.recover(root, 'operation-a', f.policy);
      await disk.recover(root, 'operation-a', f.policy);
      for (const [key, relative] of Object.entries(targets))
        assert.ok((await fs.readFile(path.join(root, relative))).equals(plan.images[key].after));
    });
  }
}
