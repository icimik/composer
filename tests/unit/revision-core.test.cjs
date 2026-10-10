const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fixture } = require('../helpers/revision-core-fixture.cjs');
const core = require('../../electron/store/revisions/journal.cjs');
const plan = (f) => core.createPlan(f.fields, f.images, f.policy, f.availableBytes);
for (const kind of ['save', 'restore', 'accept']) {
  test(`revision core builds a coherent detached ${kind} plan`, () => {
    const f = fixture(kind);
    const p = plan(f);
    assert.equal(p.intent.version, 1);
    assert.equal(p.intent.resources.length, 4);
    assert.equal(p.intent.kind, kind);
    assert.ok(Object.isFrozen(p.intent));
    f.images.manuscript.after.fill(0);
    assert.equal(p.images.manuscript.after.toString(), 'after');
    assert.equal(core.validatePlan(p, f.policy), true);
  });
}
test('revision core requires explicit policy and checks exact stage and headroom boundaries', () => {
  const f = fixture();
  assert.throws(
    () => core.createPlan(f.fields, f.images),
    (e) => e.code === 'policy-required'
  );
  const p = plan(f);
  f.policy.maxStagedBytes = p.stagedBytes;
  f.availableBytes = p.requiredBytes + f.policy.minFreeBytes;
  assert.equal(plan(f).stagedBytes, p.stagedBytes);
  f.policy.maxStagedBytes--;
  assert.throws(
    () => plan(f),
    (e) => e.code === 'stage-limit'
  );
  f.policy.maxStagedBytes++;
  f.availableBytes--;
  assert.throws(
    () => plan(f),
    (e) => e.code === 'space-limit'
  );
});
test('revision core rejects a changed body/title baseline and unrelated manifest edits', () => {
  const f = fixture();
  f.fields.expectedTitle = 'Stale title';
  assert.throws(
    () => plan(f),
    (e) => e.code === 'baseline-conflict'
  );
  f.fields.expectedTitle = 'Old title';
  f.images.manuscript.before = Buffer.from('External');
  assert.throws(
    () => plan(f),
    (e) => e.code === 'baseline-conflict'
  );
  const other = fixture();
  const meta = JSON.parse(other.images.manifest.after);
  meta.stage = 'unexpected';
  other.images.manifest.after = Buffer.from(JSON.stringify(meta));
  assert.throws(
    () => plan(other),
    (e) => e.code === 'invalid-images'
  );
});
test('revision core rejects proposal status/body disagreement', () => {
  const f = fixture('accept');
  f.images.manuscript.after = Buffer.from('Not the proposal');
  assert.throws(
    () => plan(f),
    (e) => e.code === 'invalid-images'
  );
});
test('revision core rejects malformed, unknown, duplicate-kind and tampered journals', () => {
  const f = fixture();
  const p = plan(f);
  for (const change of [
    (i) => {
      i.version = 2;
    },
    (i) => {
      i.path = '../../private';
    },
    (i) => {
      i.resources[1].kind = 'manuscript';
    },
    (i) => {
      i.documentId = '../escape';
    }
  ]) {
    const intent = structuredClone(p.intent);
    change(intent);
    assert.throws(() => core.validatePlan({ ...p, intent }, f.policy));
  }
  p.images.manuscript.after.fill(0);
  assert.throws(
    () => core.validatePlan(p, f.policy),
    (e) => e.code === 'payload-mismatch'
  );
});
test('revision core preserves absent-file identity and rejects canonical resource deletion', () => {
  const f = fixture();
  const p = plan(f);
  const audit = p.intent.resources.find((r) => r.kind === 'audit');
  assert.deepEqual(audit.before, { bytes: 0, hash: null, absent: true });
  f.images.manuscript.after = null;
  assert.throws(
    () => plan(f),
    (e) => e.code === 'invalid-images'
  );
});
