const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sourceMessages, sourceFiles } = require('../../scripts/source-limits.cjs');

test('line-count guard accepts 180 physical lines and rejects 181', () => {
  const source = Array(180).fill('// fixture').join('\n');
  assert.deepEqual(sourceMessages(source), []);
  assert.deepEqual(sourceMessages(source + '\n'), []);
  assert.ok(sourceMessages(source + '\n// overflow').some((m) => m.ruleId === 'max-lines'));
});

test('line-count guard counts blank lines, comments and CRLF', () => {
  const source = Array(181).fill('').join('\r\n') + '// counted';
  assert.ok(sourceMessages(source).some((m) => m.ruleId === 'max-lines'));
});

test('line-width guard accepts 120 characters and rejects 121', () => {
  assert.deepEqual(sourceMessages('// ' + 'x'.repeat(117)), []);
  assert.ok(sourceMessages('// ' + 'x'.repeat(118)).some((m) => m.ruleId === 'max-len'));
});

test('line-width guard does not exempt strings, templates or URL comments', () => {
  for (const source of [
    "const value = '" + 'x'.repeat(121) + "';",
    'const value = `' + 'x'.repeat(121) + '`;',
    '// https://example.com/' + 'x'.repeat(121)
  ]) {
    assert.ok(sourceMessages(source).some((m) => m.ruleId === 'max-len'));
  }
});

test('width counts Unicode codepoints and expands tabs at tab stops', () => {
  assert.deepEqual(sourceMessages('😀'.repeat(120) + '\r\n'), []);
  assert.equal(sourceMessages('😀'.repeat(121))[0].ruleId, 'max-len');
  assert.deepEqual(sourceMessages('\t' + 'x'.repeat(118)), []);
  assert.equal(sourceMessages('\t' + 'x'.repeat(119))[0].ruleId, 'max-len');
  assert.deepEqual(sourceMessages('x\t' + 'x'.repeat(118)), []);
});

test('every maintained source extension keeps strict size guards; generated output is ignored', () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'composer-limits-'));
  try {
    for (const ext of ['js', 'cjs', 'mjs', 'ts', 'mts', 'tsx']) {
      fs.writeFileSync(path.join(root, `fixture.${ext}`), '// fixture\n');
    }
    for (const dir of ['node_modules', 'dist', 'release', 'test-results', 'playwright-report']) {
      fs.mkdirSync(path.join(root, dir));
      fs.writeFileSync(path.join(root, dir, 'ignored.js'), 'x'.repeat(121));
    }
    fs.writeFileSync(path.join(root, 'ignored.md'), 'x'.repeat(121));
    assert.equal(sourceFiles(root).length, 6);
    for (const file of sourceFiles(root)) {
      assert.deepEqual(sourceMessages('// ' + 'x'.repeat(117), file), []);
      assert.ok(sourceMessages('// ' + 'x'.repeat(118), file).some((m) => m.ruleId === 'max-len'));
      assert.ok(
        sourceMessages(Array(181).fill('// fixture').join('\n'), file).some(
          (m) => m.ruleId === 'max-lines'
        )
      );
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
