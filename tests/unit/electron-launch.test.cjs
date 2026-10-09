const {test} = require('node:test');
const assert = require('node:assert/strict');
const {electronLaunchOptions} = require('../helpers/electron-launch.cjs');

test('Electron launch removes Node mode rather than assigning an empty value', () => {
  for (const value of ['', '1', '0']) {
    const input = {PATH: '/fixture/bin', ELECTRON_RUN_AS_NODE: value};
    const options = electronLaunchOptions('/fixture/workspace', {env: input, platform: 'win32'});
    assert.equal(Object.hasOwn(options.env, 'ELECTRON_RUN_AS_NODE'), false);
    assert.deepEqual(input, {PATH: '/fixture/bin', ELECTRON_RUN_AS_NODE: value});
    assert.equal(options.env.PATH, input.PATH);
  }
});

test('Electron launch strips Windows case variants and preserves other environment names', () => {
  const options = electronLaunchOptions('/fixture/workspace', {env: {
    Electron_Run_As_Node: '1', electron_run_as_node: '',
    ELECTRON_RUN_AS_NODE_EXTRA: 'retain', Path: 'fixture'
  }, platform: 'win32'});
  assert.deepEqual(options.env, {
    ELECTRON_RUN_AS_NODE_EXTRA: 'retain', Path: 'fixture',
    COMPOSER_E2E: '1', COMPOSER_TEST_ROOT: '/fixture/workspace'
  });
});

test('Electron sandbox bypass is limited to Linux test launches', () => {
  for (const platform of ['win32', 'darwin', 'linux']) {
    const options = electronLaunchOptions('/fixture/workspace', {env: {}, platform});
    assert.deepEqual(options.args, platform === 'linux' ? ['--no-sandbox', '.'] : ['.']);
  }
});

test('Electron fixture roots override inherited test paths without mutating the caller', () => {
  const input = {COMPOSER_E2E: '0', COMPOSER_TEST_ROOT: '/old'};
  const options = electronLaunchOptions('/new', {env: input, cwd: '/explicit'});
  assert.equal(options.cwd, '/explicit');
  assert.equal(options.env.COMPOSER_E2E, '1');
  assert.equal(options.env.COMPOSER_TEST_ROOT, '/new');
  assert.equal(input.COMPOSER_TEST_ROOT, '/old');
});
