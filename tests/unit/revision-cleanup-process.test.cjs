const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const disk = require('../../electron/store/revisions/disk.cjs');
const { cleanup } = require('../../electron/store/revisions/cleanup.cjs');
const retired = require('../../electron/store/revisions/retired.cjs');
const { fixture } = require('../helpers/revision-core-fixture.cjs');
const { setup, inventory } = require('../helpers/revision-disk-fixture.cjs');

for (const kind of ['save', 'restore', 'accept']) {
  for (const state of ['prepared', 'complete']) {
    const f = fixture(kind);
    const payloads = Object.entries(f.images).flatMap(([key, sides]) =>
      Object.entries(sides)
        .filter(([, value]) => value !== null)
        .map(([side]) => `${key}.${side}`)
    );
    const files = [
      ...payloads,
      ...(state === 'complete' ? ['complete.json', 'commit.json'] : []),
      'intent.json'
    ];
    const phases = [
      'cleanup:before-retire',
      'cleanup:retired',
      'cleanup:retirement-flushed',
      ...files.flatMap((name) => [`before-clean:${name}`, `cleaned:${name}`]),
      'cleanup:empty',
      'cleanup:removed'
    ];
    for (const phase of phases) {
      test(`${kind}/${state}: actual cleanup child exit at ${phase} safely retries`, async (t) => {
        const { root, nonce, f, plan, targets } = await setup(t, kind);
        if (state === 'prepared') {
          await assert.rejects(
            disk.execute(root, plan, f.policy, async (step) => {
              if (step === 'prepared') throw new Error('Stop fixture before commit');
            })
          );
        } else await disk.execute(root, plan, f.policy);
        const before = await inventory(root);
        const result = spawnSync(
          process.execPath,
          [
            path.resolve('tests/helpers/revision-disk-child.cjs'),
            root,
            nonce,
            kind,
            phase,
            'cleanup'
          ],
          { timeout: 10000, encoding: 'utf8' }
        );
        assert.equal(result.status, 77, `status=${result.status}, signal=${result.signal}`);
        const interrupted = await inventory(root);
        if (await retired.exists(root, retired.folder('operation-a'))) {
          await retired.inspect(root, 'operation-a', f.policy);
          assert.deepEqual(await inventory(root), interrupted, 'cleanup diagnosis is read-only');
          await assert.rejects(
            disk.execute(root, plan, f.policy),
            (e) => e.code === 'invalid-intent'
          );
          assert.deepEqual(
            await inventory(root),
            interrupted,
            'retired evidence blocks a new revision'
          );
        }
        await cleanup(root, 'operation-a', f.policy);
        assert.equal((await cleanup(root, 'operation-a', f.policy)).status, 'absent');
        const after = await inventory(root);
        for (const file of Object.values(targets)) assert.equal(after[file], before[file]);
        assert.deepEqual(await fs.readdir(path.join(root, '.composer/transactions')), []);
      });
    }
  }
}
