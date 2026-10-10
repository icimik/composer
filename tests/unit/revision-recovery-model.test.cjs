const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fixture } = require('../helpers/revision-core-fixture.cjs');
const core = require('../../electron/store/revisions/journal.cjs');
const recovery = require('../../electron/store/revisions/recovery.cjs');
function setup() {
  const f = fixture();
  const p = core.createPlan(f.fields, f.images, f.policy, f.availableBytes);
  const current = Object.fromEntries(Object.entries(p.images).map(([k, v]) => [k, v.before]));
  return { f, p, current };
}
test('prepared decision never installs canonical data, and third values fail closed', () => {
  const { f, p, current } = setup();
  assert.equal(recovery.inspect(p, current, {}, f.policy).action, 'cleanup-prepared');
  current.manuscript = p.images.manuscript.after;
  assert.equal(recovery.inspect(p, current, {}, f.policy).action, 'conflict');
});
test('committed decision installs only before-values and repeated after-state is idempotent', () => {
  const { f, p, current } = setup();
  const markers = { commit: core.marker(p, 'commit') };
  current.manuscript = p.images.manuscript.after;
  const view = recovery.inspect(p, current, markers, f.policy);
  assert.equal(view.action, 'roll-forward');
  assert.deepEqual(view.install, ['manifest', 'history', 'audit']);
  for (const [kind, image] of Object.entries(p.images)) current[kind] = image.after;
  assert.deepEqual(recovery.inspect(p, current, markers, f.policy).install, []);
  markers.complete = core.marker(p, 'complete');
  assert.equal(recovery.inspect(p, current, markers, f.policy).action, 'cleanup-complete');
});
test('missing decision, malformed marker, premature completion and external edits refuse writes', () => {
  const { f, p, current } = setup();
  const commit = core.marker(p, 'commit');
  current.audit = Buffer.from('External audit');
  assert.equal(recovery.inspect(p, current, { commit }, f.policy).action, 'conflict');
  assert.throws(() =>
    recovery.inspect(p, current, { complete: core.marker(p, 'complete') }, f.policy)
  );
  assert.throws(() =>
    recovery.inspect(p, current, { commit: { ...commit, intentHash: 'x' } }, f.policy)
  );
  const next = setup();
  assert.equal(
    recovery.inspect(
      next.p,
      next.current,
      {
        commit: core.marker(next.p, 'commit'),
        complete: core.marker(next.p, 'complete')
      },
      next.f.policy
    ).action,
    'conflict'
  );
});
