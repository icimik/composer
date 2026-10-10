const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Current probe uses nonce-guarded synthetic production Store regressions.
// Historical five-case results/script remain separate, not current recovery evidence.
const result = spawnSync(
  process.execPath,
  ['--test', path.join(__dirname, '../tests/unit/revision-runtime-process.test.cjs')],
  { encoding: 'utf8', timeout: 120000 }
);
const passed = result.stdout?.match(/# pass (\d+)/);
if (result.status !== 0 || !passed) {
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
      passed: Number(passed[1]),
      childExit: result.status
    })
  );
}
