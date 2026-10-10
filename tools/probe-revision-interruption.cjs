const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Current probe uses nonce-guarded synthetic production Store regressions.
// Historical five-case results/script remain separate, not current recovery evidence.
const result = spawnSync(
  process.execPath,
  ['--test', path.join(__dirname, '../tests/unit/revision-runtime-process.test.cjs')],
  { encoding: 'utf8', timeout: 120000 }
);
const count = (name) =>
  Number(result.stdout?.match(new RegExp(`^# ${name} (\\d+)\\r?$`, 'm'))?.[1] ?? NaN);
const passed = count('pass');
// Current suite is three revision kinds at twelve owned interruption boundaries.
const incomplete = ['fail', 'cancelled', 'skipped', 'todo'].some((name) => count(name) !== 0);
if (result.status !== 0 || count('tests') !== 36 || passed !== 36 || incomplete) {
  console.error(
    JSON.stringify({
      phase: 'production-runtime-probe',
      status: result.status,
      signal: result.signal
    })
  );
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify({
      scope: 'owned production Store interruptions, not GUI or physical power loss',
      passed,
      childExit: result.status
    })
  );
}
