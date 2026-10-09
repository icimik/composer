const assert = require('node:assert/strict');

const mainGate = "github.event_name == 'push' && github.ref == 'refs/heads/main'";
const nativePlatforms = ['macos-14', 'windows-latest'];

/** Validate mandatory verification and main-only packaging boundaries without running jobs. */
function assertPolicy(workflow) {
  assert.equal(workflow.permissions.contents, 'read');
  assert.ok(Object.hasOwn(workflow.on, 'push'));
  assert.ok(Object.hasOwn(workflow.on, 'pull_request'));
  assert.ok(!Object.hasOwn(workflow.on, 'pull_request_target'), 'No privileged PR workflow');
  assert.deepEqual(Object.keys(workflow.jobs).sort(), ['desktop', 'package', 'verify']);
  const { verify, desktop, package: packaging } = workflow.jobs;
  assert.equal(verify['runs-on'], 'ubuntu-22.04', 'PR verification must use Linux');
  assert.ok(!Object.hasOwn(verify, 'if'), 'Linux verification runs on every event');
  assert.ok(!verify.strategy, 'Ordinary verification must not use a native matrix');
  const commands = verify.steps.map((step) => step.run || '').join('\n');
  assert.match(commands, /npm run check/);
  assert.match(commands, /xvfb-run -a npm run test:smoke/);
  assert.match(commands, /xvfb-run -a npm run test:e2e/);
  assert.equal(desktop.needs, 'verify', 'Main native validation requires Linux success');
  assert.equal(packaging.needs, 'desktop', 'Packaging requires native success');
  for (const job of [desktop, packaging]) {
    assert.equal(job.if, mainGate, 'Native runners and packaging are main-push only');
    assert.equal(job['runs-on'], '${{ matrix.os }}');
    assert.deepEqual(job.strategy.matrix.os, nativePlatforms);
  }
  for (const [name, job] of Object.entries(workflow.jobs)) {
    assert.ok(!Object.hasOwn(job, 'continue-on-error'), `${name} must block on failure`);
    for (const step of job.steps) {
      if (/npm run (check|test:smoke|test:e2e)/.test(step.run || '')) {
        assert.ok(
          !Object.hasOwn(step, 'if'),
          `${name} required verification cannot be conditional`
        );
        assert.ok(
          !Object.hasOwn(step, 'continue-on-error'),
          `${name} required verification must block on failure`
        );
      }
      if (name !== 'package') {
        assert.ok(!step.uses?.includes('upload-artifact'), `${name} uploads outside packaging`);
        assert.doesNotMatch(
          step.run || '',
          /npm run dist|electron-builder/,
          `${name} builds installers`
        );
      }
      if (step.uses) assert.match(step.uses, /^[^@]+@[a-f0-9]{40}$/, 'Action must be SHA-pinned');
      if (step.uses?.startsWith('actions/setup-node@')) assert.equal(step.with['node-version'], 22);
    }
  }
  const uploaders = packaging.steps.filter((step) => step.uses?.includes('upload-artifact'));
  assert.equal(uploaders.length, 1, 'One explicit main-only installer upload');
  const uploader = uploaders[0];
  assert.ok(!uploader.if, 'Do not upload failed/partial package artifacts');
  assert.equal(uploader.with['if-no-files-found'], 'error');
  assert.equal(uploader.with['retention-days'], 14);
  assert.doesNotMatch(uploader.with.path, /test-results|playwright-report/);
  assert.deepEqual(uploader.with.path.trim().split('\n'), [
    'release/*.dmg',
    'release/*.zip',
    'release/*.exe'
  ]);
  const builder = packaging.steps.find((step) => step.run?.includes('npm run dist'));
  assert.equal(builder?.run, 'npm run dist -- --publish never');
  assert.equal(builder.env.CSC_IDENTITY_AUTO_DISCOVERY, 'false');
}

module.exports = { assertPolicy, mainGate };
