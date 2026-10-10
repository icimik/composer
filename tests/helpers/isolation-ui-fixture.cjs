const { test: base, expect, _electron } = require('@playwright/test');
const { fixture, inventory } = require('./isolation-fixture.cjs');
const { electronLaunchOptions } = require('./electron-launch.cjs');

const test = base.extend({
  isolation: async ({ playwright }, use) => {
    const cleanups = [];
    const f = await fixture({ after: (fn) => cleanups.push(fn) });
    let app, page;
    const c = {
      ...f,
      inventory,
      get app() {
        return app;
      },
      get page() {
        return page;
      },
      async launch() {
        app = await _electron.launch(electronLaunchOptions(f.root));
        page = await app.firstWindow();
        await expect(page.locator('body')).toBeVisible();
      },
      async close() {
        await app.close();
        app = null;
      },
      async chooseA() {
        await page
          .getByRole('button', { name: `打开 ${f.a.name}（${f.a.id}）`, exact: true })
          .click();
        await expect(page.getByLabel('正文编辑器')).toBeVisible();
      },
      async save(text) {
        await page.getByLabel('正文编辑器').fill(text);
        await page.getByLabel('文档标题').click();
        await expect(page.getByTestId('save-status')).toHaveText(/已保存/);
      }
    };
    try {
      await use(c);
    } finally {
      if (app) await app.close();
      for (const cleanup of cleanups) await cleanup();
    }
  }
});
module.exports = { test, expect };
