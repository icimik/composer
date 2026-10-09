const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { ESLint } = require('eslint');
const eslint = new ESLint({ cwd: path.resolve(__dirname, '../..') });
const options = { filePath: 'electron/limit-fixture.cjs' };
const messages = async (source) => (await eslint.lintText(source, options))[0].messages;

test('line-count guard accepts 180 physical lines and rejects 181', async () => {
  const source = Array(180).fill('// fixture').join('\n');
  assert.equal((await messages(source)).length, 0);
  assert.ok((await messages(source + '\n// overflow')).some((m) => m.ruleId === 'max-lines'));
});

test('line-count guard counts blank lines and comments', async () => {
  const source = Array(181).fill('').join('\n') + '// counted';
  assert.ok((await messages(source)).some((m) => m.ruleId === 'max-lines'));
});

test('line-width guard accepts 120 characters and rejects 121', async () => {
  assert.equal((await messages('// ' + 'x'.repeat(117))).length, 0);
  assert.ok((await messages('// ' + 'x'.repeat(118))).some((m) => m.ruleId === 'max-len'));
});

test('line-width guard does not exempt strings, templates or URL comments', async () => {
  for (const source of [
    "const value = '" + 'x'.repeat(121) + "';",
    'const value = `' + 'x'.repeat(121) + '`;',
    '// https://example.com/' + 'x'.repeat(121)
  ]) {
    assert.ok((await messages(source)).some((m) => m.ruleId === 'max-len'));
  }
});

test('ESM TypeScript configuration retains strict source size guards', async () => {
  const filePath = 'vite.config.mts';
  assert.equal(await eslint.isPathIgnored(filePath), false);
  const lint = async (source) => (await eslint.lintText(source, { filePath }))[0].messages;
  assert.equal((await lint(Array(180).fill('// fixture').join('\n'))).length, 0);
  assert.ok(
    (await lint(Array(181).fill('// fixture').join('\n'))).some((m) => m.ruleId === 'max-lines')
  );
  assert.equal((await lint('// ' + 'x'.repeat(117))).length, 0);
  assert.ok((await lint('// ' + 'x'.repeat(118))).some((m) => m.ruleId === 'max-len'));
});
