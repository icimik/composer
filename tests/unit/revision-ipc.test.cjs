const { test } = require('node:test');
const assert = require('node:assert/strict');
const { revisionHandlers } = require('../../electron/revision-ipc.cjs');

test('IPC revision write requires captured identity; malformed payload never reaches a writer', async () => {
  let writes = 0;
  const handlers = revisionHandlers({
    serial: async (fn) => fn(),
    saveDocument: async () => {
      writes++;
    }
  });
  for (const identity of [
    undefined,
    { operationId: '../escape', expectedTitle: 'Title' },
    { operationId: 'valid-id', expectedTitle: 'Title', path: '/unsafe' }
  ])
    await assert.rejects(
      handlers.saveDocument('workspace', 'doc', 'Title', 'Text', 'hash', undefined, identity)
    );
  assert.equal(writes, 0);
  await handlers.saveDocument('workspace', 'doc', 'Title', 'Text', 'hash', undefined, {
    operationId: 'valid-id',
    expectedTitle: 'Title'
  });
  assert.equal(writes, 1);
});
test('preview/apply IPC accepts only validated registry identities under the queue', async () => {
  const calls = [];
  const h = revisionHandlers({
    serial: async (fn) => {
      calls.push('queue');
      return fn();
    },
    revisionPreview: (id) => {
      calls.push(id);
    },
    applyRevision: (id, op) => {
      calls.push([id, op]);
    }
  });
  await assert.rejects(h.applyRevision('workspace', '../escape'));
  await assert.rejects(h.revisionPreview('../escape'));
  assert.deepEqual(calls, ['queue', 'queue']);
  await h.revisionPreview('workspace');
  await h.applyRevision('workspace', 'operation');
  assert.deepEqual(calls.slice(2), ['queue', 'workspace', 'queue', ['workspace', 'operation']]);
});
