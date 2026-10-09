const {test, expect, _electron} = require('@playwright/test');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {electronLaunchOptions} = require('../helpers/electron-launch.cjs');

test('Electron starts as a desktop process despite inherited Node-mode pollution', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'composer-launch-'));
  let app;
  try {
    const options = electronLaunchOptions(root, {
      env: {...process.env, ELECTRON_RUN_AS_NODE: '1', Electron_Run_As_Node: ''}
    });
    expect(Object.keys(options.env).some(key => key.toUpperCase() === 'ELECTRON_RUN_AS_NODE')).toBe(false);
    app = await _electron.launch(options);
    const page = await app.firstWindow();
    await expect(page.getByTestId('composer-app')).toBeVisible();
    expect(await app.evaluate(() => process.versions.electron)).toBeTruthy();
    expect(await app.evaluate(({BrowserWindow}) => BrowserWindow.getAllWindows().length)).toBe(1);
  } finally {
    if (app) await app.close();
    await fs.rm(root, {recursive: true, force: true});
  }
});
