const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fixture } = require('../helpers/revision-core-fixture.cjs');
const core = require('../../electron/store/revisions/journal.cjs');
const format = require('../../electron/store/revisions/format.cjs');

test('same request digest survives clock change; committed audit identity prevents new writes', () => {
  const f = fixture();
  const p = core.createPlan(f.fields, f.images, f.policy, f.availableBytes);
  const digest = format.requestDigest(
    { ...f.fields, createdAt: '2026-10-11T00:00:00.000Z' },
    'New title',
    format.hash('after')
  );
  assert.equal(digest, p.intent.requestDigest);
  const current = { title: 'New title', hash: format.hash('after') };
  assert.deepEqual(
    core.findCommitted(p.images.audit.after, 'operation-a', digest, current, f.policy),
    { operationId: 'operation-a', status: 'already-committed', stale: false }
  );
  current.hash = format.hash('later author revision');
  assert.equal(
    core.findCommitted(p.images.audit.after, 'operation-a', digest, current, f.policy).stale,
    true
  );
  assert.equal(
    core.findCommitted(p.images.audit.after, 'operation-other', digest, current, f.policy),
    null
  );
});
test('operation ID reuse with a different request and partial audit lines fail closed', () => {
  const f = fixture();
  const p = core.createPlan(f.fields, f.images, f.policy, f.availableBytes);
  const current = { title: 'New title', hash: format.hash('after') };
  assert.throws(
    () =>
      core.findCommitted(
        p.images.audit.after,
        'operation-a',
        format.hash('different request'),
        current,
        f.policy
      ),
    (e) => e.code === 'operation-conflict'
  );
  assert.throws(
    () =>
      core.findCommitted(
        Buffer.from('{"private":"synthetic'),
        'operation-a',
        p.intent.requestDigest,
        current,
        f.policy
      ),
    (e) => e.code === 'invalid-images' && !e.message.includes('private')
  );
});
