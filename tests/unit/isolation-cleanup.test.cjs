const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cleanupFixture } = require('../helpers/isolation-cleanup.cjs');
test('synthetic fixture cleanup runs and close error propagates after failed close', async () => {
  const calls = [];
  const app = {
    evaluate: async (fn) =>
      fn({
        BrowserWindow: {
          getAllWindows: () => [{ removeAllListeners: (event) => calls.push(event) }]
        }
      }),
    close: async () => {
      calls.push('attempt-close');
      throw new Error('synthetic close failure');
    }
  };
  await assert.rejects(
    cleanupFixture(app, [async () => calls.push('cleanup')]),
    /synthetic close failure/
  );
  assert.deepEqual(calls, ['close', 'attempt-close', 'cleanup']);
});
test('crashed evaluation still attempts close and cleanup; no-app cleanup remains supported', async () => {
  const calls = [];
  const app = {
    evaluate: async () => {
      throw new Error('synthetic crashed process');
    },
    close: async () => calls.push('close')
  };
  await cleanupFixture(app, [async () => calls.push('cleanup')]);
  await cleanupFixture(null, [async () => calls.push('no-app-cleanup')]);
  assert.deepEqual(calls, ['close', 'cleanup', 'no-app-cleanup']);
});
