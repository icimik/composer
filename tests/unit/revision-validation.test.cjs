const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fixture } = require('../helpers/revision-core-fixture.cjs');
const core = require('../../electron/store/revisions/journal.cjs');
const { hash } = require('../../electron/store/revisions/format.cjs');

test('bounded intent and identity parsing reject oversized input before decoding', () => {
  const f = fixture();
  const limit = { ...f.policy, maxStagedBytes: 2 };
  assert.throws(
    () => core.decodeIntent(Buffer.from('not JSON'), limit),
    (e) => e.code === 'stage-limit'
  );
  assert.throws(
    () =>
      core.findCommitted(
        Buffer.from('not JSON'),
        'operation-a',
        hash('a'),
        { title: 'Title', hash: hash('a') },
        limit
      ),
    (e) => e.code === 'stage-limit'
  );
  assert.throws(
    () => core.decodeIntent(Buffer.from([0xc0, 0xaf]), f.policy),
    (e) => e.code === 'invalid-images'
  );
  const p = core.createPlan(f.fields, f.images, f.policy, f.availableBytes);
  assert.deepEqual(core.decodeIntent(Buffer.from(JSON.stringify(p.intent)), f.policy), p.intent);
});
test('legacy audit bytes remain exact while duplicate operation identities are rejected', () => {
  const f = fixture();
  const old = JSON.parse(f.images.audit.after);
  delete old.operationId;
  const legacy = JSON.stringify({ ...old, time: '2026-10-09T00:00:00.000Z' });
  f.images.audit.before = Buffer.from(legacy);
  // The new row needs its identity; legacy rows remain untouched.
  old.operationId = f.fields.operationId;
  f.images.audit.after = Buffer.from(legacy + '\n' + JSON.stringify(old) + '\n');
  const p = core.createPlan(f.fields, f.images, f.policy, f.availableBytes);
  assert.ok(p.images.audit.after.subarray(0, legacy.length).equals(Buffer.from(legacy)));
  const current = { title: 'New title', hash: hash('after') };
  assert.equal(
    core.findCommitted(
      f.images.audit.before,
      'operation-a',
      p.intent.requestDigest,
      current,
      f.policy
    ),
    null
  );
  const duplicated = Buffer.concat([
    p.images.audit.after,
    p.images.audit.after.subarray(legacy.length + 1)
  ]);
  assert.throws(
    () => core.findCommitted(duplicated, 'operation-a', p.intent.requestDigest, current, f.policy),
    (e) => e.code === 'invalid-images'
  );
});
test('continuation acceptance uses the existing canonical append rule', () => {
  const f = fixture('accept');
  for (const side of ['before', 'after']) {
    const meta = JSON.parse(f.images.manifest[side]);
    meta.sessions[0].proposals[0].action = 'continue';
    f.images.manifest[side] = Buffer.from(JSON.stringify(meta));
  }
  f.images.manuscript.after = Buffer.from('before\n\nafter');
  const row = JSON.parse(f.images.audit.after);
  row.afterHash = hash('before\n\nafter');
  f.images.audit.after = Buffer.from(JSON.stringify(row) + '\n');
  const p = core.createPlan(f.fields, f.images, f.policy, f.availableBytes);
  assert.equal(p.images.manuscript.after.toString(), 'before\n\nafter');
});
test('oversized manuscript content and unknown record fields fail closed', () => {
  const f = fixture();
  f.policy.maxStagedBytes = 10_000_000;
  f.images.manuscript.after = Buffer.from('x'.repeat(2_000_001));
  assert.throws(
    () => core.createPlan(f.fields, f.images, f.policy, f.availableBytes),
    (e) => e.code === 'invalid-images'
  );
  const other = fixture();
  const row = JSON.parse(other.images.audit.after);
  row.rawProviderResponse = 'synthetic private text';
  other.images.audit.after = Buffer.from(JSON.stringify(row) + '\n');
  assert.throws(
    () => core.createPlan(other.fields, other.images, other.policy, other.availableBytes),
    (e) => e.code === 'invalid-images' && !e.message.includes('private text')
  );
});
test('title-only revision keeps history and invalid manuscript UTF-8 is refused', () => {
  const f = fixture();
  f.images.manuscript.after = Buffer.from('before');
  f.images.history.after = f.images.history.before;
  const row = JSON.parse(f.images.audit.after);
  row.afterHash = hash('before');
  f.images.audit.after = Buffer.from(JSON.stringify(row) + '\n');
  const p = core.createPlan(f.fields, f.images, f.policy, f.availableBytes);
  assert.ok(p.images.history.before.equals(p.images.history.after));
  f.images.manuscript.after = Buffer.from([0xc0, 0xaf]);
  assert.throws(
    () => core.createPlan(f.fields, f.images, f.policy, f.availableBytes),
    (e) => e.code === 'invalid-images'
  );
});
