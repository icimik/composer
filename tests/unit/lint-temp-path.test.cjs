const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { withLintProject, projectMessages } = require('../helpers/lint-project.cjs');

test('aliased temp directories retain root-config type-aware checks and canonical project paths', () => {
  const real = fs.mkdtempSync(path.join(os.tmpdir(), 'composer-real-temp-'));
  const alias = real + '-alias';
  const original = os.tmpdir;
  try {
    fs.symlinkSync(real, alias, 'junction');
    os.tmpdir = () => alias;
    withLintProject(
      'export async function fixture() { await Promise.resolve(1); }',
      'src',
      'ts',
      (project) => {
        assert.deepEqual(projectMessages(project), []);
        assert.equal(project.root, fs.realpathSync(project.root));
        assert.equal(project.file, fs.realpathSync(project.file));
      }
    );
    withLintProject('export function fixture() { Promise.resolve(1); }', 'src', 'ts', (project) => {
      assert.ok(
        projectMessages(project).some(
          (message) => message.code === 'typescript(no-floating-promises)'
        )
      );
    });
    assert.deepEqual(fs.readdirSync(real), [], 'temporary fixture cleanup must still run');
  } finally {
    os.tmpdir = original;
    fs.rmSync(alias, { recursive: true, force: true });
    fs.rmSync(real, { recursive: true, force: true });
  }
});

test('non-JSON CLI failures preserve the actionable original stdout diagnostic', () => {
  withLintProject('export const fixture = 1;', 'src', 'ts', (project) => {
    fs.writeFileSync(path.join(project.root, '.oxlintrc.json'), '{');
    assert.throws(
      () => projectMessages(project),
      (error) => /Failed to parse oxlint configuration file/u.test(error.message),
      'a generic Unexpected token error must not mask the native CLI configuration error'
    );
  });
});
