const { test: base, expect, _electron } = require('@playwright/test');
const { setup } = require('./revision-runtime-fixture.cjs');
const { electronLaunchOptions } = require('./electron-launch.cjs');
const { cleanupFixture } = require('./isolation-cleanup.cjs');

const test = base.extend({
  revisionKind: ['save', { option: true }],
  recovery: async ({ revisionKind }, use) => {
    const cleanups = [];
    const f = await setup({ after: (fn) => cleanups.push(fn) }, revisionKind);
    let app, page;
    const c = {
      ...f,
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
      async interrupt(phase) {
        await app.evaluate(
          async ({ app }, { root, nonce, target, phase }) => {
            const fs = process.getBuiltinModule('node:fs/promises');
            const path = process.getBuiltinModule('node:path');
            const temporary = await fs.realpath(process.getBuiltinModule('node:os').tmpdir());
            if (
              !root.startsWith(temporary + path.sep + 'composer-isolation-') ||
              (await fs.realpath(root)) !== root ||
              (await fs.readFile(path.join(root, '.revision-ownership'), 'utf8')) !== nonce
            )
              throw Error('Owned Electron fixture required');
            if (
              !target.startsWith(path.join(root, 'data/workspaces') + path.sep) ||
              (await fs.realpath(target)) !== target
            )
              throw Error('Owned fixture workspace required');
            const require = process
              .getBuiltinModule('node:module')
              .createRequire(path.join(app.getAppPath(), 'package.json'));
            const runner = require('./electron/store/revisions/worker-runner.cjs');
            const { mutate } = require('./electron/store/revisions/mutation.cjs');
            const { resourcePolicy } = require('./electron/store/revisions/resource-policy.cjs');
            const original = runner.run;
            runner.run = (task, directory, request) =>
              task === 'mutate' && directory === target
                ? mutate(directory, request, resourcePolicy, async (step) => {
                    if (step === phase) process.exit(77);
                  })
                : original(task, directory, request);
          },
          { root: f.root, nonce: f.nonce, target: f.a.path, phase }
        );
      },
      async crash(trigger) {
        const exit = new Promise((resolve) => app.process().once('exit', (code) => resolve(code)));
        await trigger();
        expect(await exit).toBe(77);
        app = null;
      },
      async confirm(committed = true) {
        const fault = page.getByTestId('workspace-fault').filter({ hasText: f.a.id });
        await fault.getByRole('button', { name: '检查修订记录', exact: true }).click();
        const label = committed ? '我确认完成已提交的修订' : '我确认清理已验证的暂存记录';
        const action = committed ? '完成已提交的修订' : '清理已验证的暂存记录';
        await expect(fault.getByRole('button', { name: action, exact: true })).toBeDisabled();
        await fault.getByRole('checkbox', { name: label, exact: true }).check();
        await fault.getByRole('button', { name: action, exact: true }).click();
        await expect(fault).toHaveCount(0);
        await expect(page.getByRole('button', { name: '重试加载工作区' })).toBeEnabled();
      },
      async chooseA() {
        await page
          .getByRole('button', { name: `打开 ${f.a.name}（${f.a.id}）`, exact: true })
          .click();
        await expect(page.getByLabel('正文编辑器')).toBeVisible();
      }
    };
    try {
      await use(c);
    } finally {
      await cleanupFixture(app, cleanups);
    }
  }
});
module.exports = { test, expect };
