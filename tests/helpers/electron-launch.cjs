const path = require('node:path');

function electronLaunchOptions(
  testRoot,
  { env = process.env, platform = process.platform, cwd = path.resolve(__dirname, '../..') } = {}
) {
  // Windows environment names are case-insensitive. Omit this key entirely:
  // an empty value must not be used as a portable way to disable Node mode.
  const cleanEnv = Object.fromEntries(
    Object.entries(env).filter(([key]) => key.toUpperCase() !== 'ELECTRON_RUN_AS_NODE')
  );
  return {
    args: [...(platform === 'linux' ? ['--no-sandbox'] : []), '.'],
    cwd,
    env: { ...cleanEnv, COMPOSER_E2E: '1', COMPOSER_TEST_ROOT: testRoot }
  };
}

module.exports = { electronLaunchOptions };
