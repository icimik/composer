const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const disk = require('../../electron/store/revisions/disk.cjs');
const { setup, inventory } = require('../helpers/revision-disk-fixture.cjs');

async function clean(...args) {
  return require('../../electron/store/revisions/cleanup.cjs').cleanup(...args);
}
for (const state of ['prepared', 'complete']) {
  test(`${state} journal cleanup preserves canonical bytes and repeated cleanup is harmless`, async (t) => {
    const { root, f, plan, targets } = await setup(t);
    if (state === 'prepared') {
      await assert.rejects(
        disk.execute(root, plan, f.policy, async (phase) => {
          if (phase === 'prepared') throw new Error('Stop fixture');
        })
      );
    } else await disk.execute(root, plan, f.policy);
    const canonical = {};
    for (const file of Object.values(targets)) {
      try {
        canonical[file] = await fs.readFile(path.join(root, file));
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
        canonical[file] = null;
      }
    }
    assert.equal((await clean(root, 'operation-a', f.policy)).status, 'cleaned');
    assert.equal((await clean(root, 'operation-a', f.policy)).status, 'absent');
    assert.deepEqual(await fs.readdir(path.join(root, '.composer/transactions')), []);
    for (const [file, before] of Object.entries(canonical)) {
      if (before === null)
        await assert.rejects(fs.access(path.join(root, file)), { code: 'ENOENT' });
      else assert.ok((await fs.readFile(path.join(root, file))).equals(before));
    }
  });
}
test('cleanup refuses committed-but-incomplete and incomplete preparation without deleting evidence', async (t) => {
  for (const stop of ['staged:manuscript:after', 'commit']) {
    const { root, f, plan } = await setup(t);
    await assert.rejects(
      disk.execute(root, plan, f.policy, async (phase) => {
        if (phase === stop) throw new Error('Stop fixture');
      })
    );
    const before = await inventory(root);
    await assert.rejects(clean(root, 'operation-a', f.policy), (e) =>
      ['io-failure', 'baseline-conflict'].includes(e.code)
    );
    assert.deepEqual(await inventory(root), before);
  }
});
test('cleanup refuses third-value canonical bytes and unknown files before retirement', async (t) => {
  const { root, f, plan, targets } = await setup(t);
  await disk.execute(root, plan, f.policy);
  await fs.writeFile(path.join(root, targets.manuscript), 'External author bytes');
  const before = await inventory(root);
  await assert.rejects(clean(root, 'operation-a', f.policy), (e) => e.code === 'baseline-conflict');
  assert.deepEqual(await inventory(root), before);
});
