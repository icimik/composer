const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { syntaxMessages } = require('../../scripts/source-limits.cjs');
const root = path.resolve(__dirname, '../..');
const cli = path.join(path.dirname(require.resolve('oxlint/package.json')), 'bin/oxlint');
let serial = 0;

function nativeMessages(source, target = 'electron') {
  const ext = target === 'src' ? 'tsx' : target === '.' ? 'mjs' : 'cjs';
  const file = path.join(root, target, `lint-fixture-${process.pid}-${serial++}.${ext}`);
  fs.writeFileSync(file, source);
  try {
    const result = spawnSync(
      process.execPath,
      [cli, '--format', 'json', '--max-warnings', '0', file],
      {
        cwd: root,
        encoding: 'utf8'
      }
    );
    assert.ok([0, 1].includes(result.status), result.stderr || result.error?.message);
    const output = JSON.parse(result.stdout);
    return output.diagnostics;
  } finally {
    fs.rmSync(file, { force: true });
  }
}

test('strict compile-only CJS guard rejects duplicate parameters and legacy octal', () => {
  for (const source of ['function f(a,a) { return a; }', 'const value = 012;']) {
    assert.equal(syntaxMessages(source, 'electron/fixture.cjs')[0].ruleId, 'strict-cjs-syntax');
  }
  for (const source of [
    '#!/usr/bin/env node\nmodule.exports = 0o12;',
    'const value = 0o12; module.exports = value;',
    'if (require.main !== module) return;',
    'throw new Error("never executed");'
  ]) {
    assert.deepEqual(syntaxMessages(source, 'scripts/fixture.cjs'), []);
  }
});

test('native linter retains recommended diagnostics and nursery rules', () => {
  for (const [source, rule] of [
    ['debugger;', 'no-debugger'],
    ['if (false) {}', 'no-constant-condition'],
    ['missingGlobal();', 'no-undef'],
    ['let value; module.exports = value;', 'no-unassigned-vars'],
    ['let value = 1; value = 2; module.exports = value;', 'no-useless-assignment']
  ]) {
    assert.ok(
      nativeMessages(source).some((message) => message.code === `eslint(${rule})`),
      source
    );
  }
});

test('globals and disabled unused-variable policy retain original scope', () => {
  assert.deepEqual(nativeMessages('module.exports = process.pid; const unused = 1;'), []);
  assert.deepEqual(nativeMessages('document.title;', 'tests/e2e'), []);
  assert.ok(nativeMessages('document.title;', 'scripts/design').length > 0);
  const config = require('../../.oxlintrc.json');
  assert.ok(
    config.overrides.some(
      (entry) => entry.files.includes('scripts/design/showcase-runtime.cjs') && entry.env.browser
    )
  );
  assert.ok(nativeMessages('document.title;').length > 0);
  assert.deepEqual(
    nativeMessages('const unused: number = 1; document.title; process.pid;', 'src'),
    []
  );
  assert.ok(nativeMessages('missingGlobal();', '.').length > 0);
});

test('native parser rejects unsupported duplicate-argument and octal syntax in ESM', () => {
  for (const source of ['function f(a,a) { return a; }', 'const value = 012;']) {
    assert.ok(nativeMessages(source, '.').length > 0);
  }
  assert.ok(nativeMessages('function f(a,a) { return a; }', 'src').length > 0);
});

test('TypeScript compiler rejects legacy octal that script-mode TSX parsing permits', () => {
  const file = path.join(root, 'src', `lint-octal-${process.pid}.tsx`);
  fs.writeFileSync(file, 'const value = 012;');
  try {
    assert.deepEqual(
      nativeMessages('const value = 012;', 'src'),
      [],
      'document native TSX parser gap rather than claiming unsupported rule parity'
    );
    const cliPath = path.join(root, 'node_modules/typescript/bin/tsc');
    const result = spawnSync(process.execPath, [cliPath, '--noEmit'], {
      cwd: root,
      encoding: 'utf8'
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, /octal literals|TS1121/iu);
  } finally {
    fs.rmSync(file, { force: true });
  }
});

test('native physical-line guard keeps 180/181 boundaries', () => {
  assert.deepEqual(nativeMessages(Array(180).fill('// fixture').join('\n')), []);
  assert.ok(nativeMessages(Array(181).fill('// fixture').join('\n')).length > 0);
});

test('dependency/config policy excludes ESLint and type-aware engines', () => {
  const pkg = require('../../package.json');
  const lock = require('../../package-lock.json');
  assert.equal(pkg.devDependencies.oxlint, '1.87.0');
  for (const key of Object.keys(lock.packages)) {
    assert.ok(
      !/node_modules\/(?:eslint|@eslint\/|typescript-eslint|@typescript-eslint\/)/u.test(key),
      key
    );
  }
  assert.ok(!pkg.devDependencies['oxlint-tsgolint']);
  assert.match(pkg.scripts.lint, /source-limits\.cjs/u);
});
