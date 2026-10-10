const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const disk = require('../../electron/store/revisions/disk.cjs');
const { cleanup } = require('../../electron/store/revisions/cleanup.cjs');
const { setup, inventory } = require('../helpers/revision-disk-fixture.cjs');

test('retirement flush failure must be flushed again before a retry deletes any payload', async (t) => {
  if (process.platform === 'win32') {
    t.skip('Windows directory synchronization is explicitly unsupported by this adapter');
    return;
  }
  const { root, f, plan } = await setup(t);
  await disk.execute(root, plan, f.policy);
  const parent = path.join(root, '.composer/transactions');
  const original = fs.open;
  let deny = true;
  fs.open = async (file, ...args) => {
    const handle = await original(file, ...args);
    if (file === parent) {
      const sync = handle.sync.bind(handle);
      handle.sync = async () => {
        if (deny) throw Object.assign(new Error('Injected retirement flush'), { code: 'EIO' });
        return sync();
      };
    }
    return handle;
  };
  t.after(() => {
    fs.open = original;
  });
  await assert.rejects(cleanup(root, 'operation-a', f.policy), (e) => e.code === 'io-failure');
  const interrupted = await inventory(root);
  assert.ok(interrupted['.composer/transaction-cleanup/operation-a/intent.json']);
  await assert.rejects(cleanup(root, 'operation-a', f.policy), (e) => e.code === 'io-failure');
  assert.deepEqual(
    await inventory(root),
    interrupted,
    'retry cannot delete before parent flush succeeds'
  );
  deny = false;
  assert.equal((await cleanup(root, 'operation-a', f.policy)).status, 'cleaned');
});
