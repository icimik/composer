const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { setup, inventory } = require('../helpers/revision-disk-fixture.cjs');
const disk = require('../../electron/store/revisions/disk.cjs');
const resources = ['manuscript', 'manifest', 'history', 'audit'];
const phases = [
  ...resources.flatMap((kind) => [`scratch:${kind}`, `installed:${kind}`]),
  'before:complete',
  'complete'
];
for (const kind of ['save', 'restore', 'accept']) {
  for (const phase of phases) {
    test(`${kind}: interrupted explicit replay at ${phase} is repeatable without duplicates`, async (t) => {
      const { root, nonce, f, plan, targets } = await setup(t, kind);
      await assert.rejects(
        disk.execute(root, plan, f.policy, async (boundary) => {
          if (boundary === 'commit') throw new Error('Synthetic suspension');
        })
      );
      const result = spawnSync(
        process.execPath,
        [
          path.resolve('tests/helpers/revision-disk-child.cjs'),
          root,
          nonce,
          kind,
          phase,
          'recover'
        ],
        { timeout: 10000, encoding: 'utf8' }
      );
      assert.equal(result.status, 77, `status=${result.status}, signal=${result.signal}`);
      const before = await inventory(root);
      await disk.preview(root, 'operation-a', f.policy);
      assert.deepEqual(await inventory(root), before);
      await disk.recover(root, 'operation-a', f.policy);
      await disk.recover(root, 'operation-a', f.policy);
      for (const [key, relative] of Object.entries(targets))
        assert.ok((await fs.readFile(path.join(root, relative))).equals(plan.images[key].after));
    });
  }
}
