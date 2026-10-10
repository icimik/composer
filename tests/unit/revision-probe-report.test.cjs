const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const file = path.resolve('tools/probe-revision-interruption.cjs');
const source = fs.readFileSync(file, 'utf8');
const counts = { tests: 36, pass: 36, fail: 0, cancelled: 0, skipped: 0, todo: 0 };
function report(changes = {}, status = 0) {
  const summary = { ...counts, ...changes };
  const result = {
    status,
    signal: null,
    stdout: Object.entries(summary)
      .filter(([, value]) => value !== undefined)
      .map(([name, value]) => `# ${name} ${value}`)
      .join('\r\n'),
    stderr: 'Synthetic private exception must not be logged'
  };
  const output = [];
  const process = { execPath: 'unused-mocked-runtime', exitCode: undefined };
  vm.runInNewContext(source, {
    __dirname: path.dirname(file),
    process,
    console: { log: (value) => output.push(value), error: (value) => output.push(value) },
    require: (name) => (name === 'node:child_process' ? { spawnSync: () => result } : require(name))
  });
  return { code: process.exitCode, output };
}
test('production probe accepts exactly the complete unskipped interruption matrix', () => {
  const run = report();
  assert.equal(run.code, undefined);
  assert.equal(JSON.parse(run.output[0]).passed, 36);
});
test('production probe refuses partial, skipped, TODO, missing and failed reports without raw exceptions', () => {
  for (const changes of [
    { pass: 0 },
    { tests: 35, pass: 35 },
    { skipped: 1 },
    { todo: 1 },
    { cancelled: 1 },
    { fail: 1 },
    { skipped: undefined }
  ]) {
    const run = report(changes);
    assert.equal(run.code, 1);
    assert.equal(JSON.parse(run.output[0]).phase, 'production-runtime-probe');
    assert.ok(!run.output.join('').includes('private exception'));
  }
  assert.equal(report({}, 1).code, 1);
});
