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
test('every cleanup runs after rejection, with all failures reported', async () => {
  const calls = [];
  const first = Error('first cleanup');
  const second = Error('second cleanup');
  await assert.rejects(
    cleanupFixture(null, [
      async () => {
        calls.push(1);
        throw first;
      },
      async () => calls.push(2),
      async () => {
        calls.push(3);
        throw second;
      }
    ]),
    (error) =>
      error instanceof AggregateError && error.errors[0] === first && error.errors[1] === second
  );
  assert.deepEqual(calls, [1, 2, 3]);
});
test('close remains primary cause when cleanup also fails', async () => {
  const primary = Error('close');
  const secondary = Error('cleanup');
  const app = {
    evaluate: async () => {},
    close: async () => {
      throw primary;
    }
  };
  await assert.rejects(
    cleanupFixture(app, [
      async () => {
        throw secondary;
      }
    ]),
    (error) =>
      error instanceof AggregateError &&
      error.cause === primary &&
      error.errors[0] === primary &&
      error.errors[1] === secondary
  );
});
