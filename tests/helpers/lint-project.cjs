const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const repository = path.resolve(__dirname, '../..');
const cli = path.join(path.dirname(require.resolve('oxlint/package.json')), 'bin/oxlint');

function withLintProject(source, target, extension, callback) {
  // macOS temp paths may alias /private/var. Oxlint root-config identity needs the canonical path.
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'composer-lint-')));
  try {
    for (const file of ['.oxlintrc.json', 'tsconfig.json', 'vite.config.mts']) {
      fs.copyFileSync(path.join(repository, file), path.join(root, file));
    }
    fs.symlinkSync(
      path.join(repository, 'node_modules'),
      path.join(root, 'node_modules'),
      'junction'
    );
    fs.mkdirSync(path.join(root, target), { recursive: true });
    const file = path.join(root, target, `fixture.${extension}`);
    fs.writeFileSync(file, source);
    return callback({ root, file });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function projectMessages({ root, file }) {
  const result = spawnSync(
    process.execPath,
    [cli, '--format', 'json', '--max-warnings', '0', file],
    {
      cwd: root,
      encoding: 'utf8'
    }
  );
  const diagnostic = [result.error?.message, result.stdout, result.stderr]
    .filter(Boolean)
    .join('\n');
  assert.ok([0, 1].includes(result.status), diagnostic);
  let output;
  try {
    output = JSON.parse(result.stdout);
  } catch (cause) {
    throw new Error(
      `Oxlint did not return JSON diagnostics (exit ${result.status}):\n${diagnostic}`,
      { cause }
    );
  }
  assert.ok(Array.isArray(output?.diagnostics), `Invalid Oxlint diagnostics:\n${diagnostic}`);
  return output.diagnostics;
}

function lintMessages(source, target = 'src', extension = 'ts') {
  return withLintProject(source, target, extension, projectMessages);
}

module.exports = { withLintProject, projectMessages, lintMessages, repository };
