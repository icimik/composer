const { test, expect } = require('../helpers/composer-fixture.cjs');

test('rejected close-ready IPC stays in the flush rejection chain', async ({ composer: c }) => {
  const errors = [];
  c.page.on('pageerror', (error) => errors.push(error.message));
  await c.app.evaluate(({ ipcMain }) => {
    globalThis.closeFixtureCalls = 0;
    ipcMain.removeHandler('composer:close-ready');
    ipcMain.handle('composer:close-ready', async () => {
      globalThis.closeFixtureCalls++;
      throw Error('synthetic close-ready rejection');
    });
  });
  try {
    await c.page.evaluate(() => {
      window.closeFixtureFailures = [];
      window.closeFixtureListener = (event) =>
        window.closeFixtureFailures.push(event.reason?.message);
      window.addEventListener('unhandledrejection', window.closeFixtureListener);
      window.dispatchEvent(new Event('composer-before-close'));
    });
    await expect.poll(() => c.app.evaluate(() => globalThis.closeFixtureCalls)).toBe(1);
    const unhandled = await c.page.evaluate(async () => {
      // Drain renderer tasks after the actual rejecting IPC was observed, without a fixed delay.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return window.closeFixtureFailures;
    });
    expect(unhandled).toEqual([]);
    expect(errors).toEqual([]);
    await expect(c.page.getByLabel('正文编辑器')).toBeVisible();
  } finally {
    await c.page.evaluate(() => {
      window.removeEventListener('unhandledrejection', window.closeFixtureListener);
      delete window.closeFixtureListener;
      delete window.closeFixtureFailures;
    });
    // The failure is test-only; restore the registered handler before normal fixture close.
    await c.app.evaluate(({ ipcMain, BrowserWindow }) => {
      delete globalThis.closeFixtureCalls;
      ipcMain.removeHandler('composer:close-ready');
      ipcMain.handle('composer:close-ready', (event) => {
        BrowserWindow.fromWebContents(event.sender)?.destroy();
      });
    });
  }
});
