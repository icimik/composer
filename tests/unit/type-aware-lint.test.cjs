const { test } = require('node:test');
const assert = require('node:assert/strict');
const { lintMessages } = require('../helpers/lint-project.cjs');

function lint(source, target = 'src') {
  const ext = target === 'src' ? 'ts' : 'cjs';
  return lintMessages(source, target, ext);
}

test('CJS dynamic-code and native-prototype mutation guards reject synthetic fixtures', () => {
  for (const [source, rule] of [
    ['eval("1");', 'no-eval'],
    ['setTimeout("1", 1);', 'no-implied-eval'],
    ['new Function("return 1");', 'no-new-func'],
    ['Array.prototype.fixture = function () {};', 'no-extend-native']
  ]) {
    assert.ok(
      lint(source, 'electron').some((message) => message.code === `eslint(${rule})`),
      rule
    );
  }
});

test('type-aware rules reject floating promises, promise conditions and await non-thenables', () => {
  for (const [source, rule] of [
    ['export function fixture() { Promise.resolve(1); }', 'no-floating-promises'],
    [
      'export function fixture() { if (Promise.resolve(true)) console.log("fixture"); }',
      'no-misused-promises'
    ],
    ['export async function fixture() { await 1; }', 'await-thenable']
  ]) {
    assert.ok(
      lint(source).some((message) => message.code === `typescript(${rule})`),
      rule
    );
  }
});

test('handled and awaited promises pass the type-aware lint gate', () => {
  for (const source of [
    'export async function fixture() { await Promise.resolve(1); }',
    'export function fixture() { void Promise.resolve(1).catch(() => {}); }'
  ]) {
    assert.deepEqual(lint(source), []);
  }
});

test('indexed access and exact optional properties are checked in standalone lint', () => {
  for (const source of [
    'export const fixture: string = ["value"][0];',
    'export const fixture: { value?: string } = { value: undefined };',
    'export function fixture(value: boolean) { if (value) return 1; }'
  ]) {
    assert.ok(lint(source).some((message) => message.code?.startsWith('typescript(TS')));
  }
});
