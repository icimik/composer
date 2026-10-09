const { test: base, expect, _electron } = require('@playwright/test');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { electronLaunchOptions } = require('./electron-launch.cjs');
const test = base.extend({
  composer: async ({ playwright }, use) => {
    let app,
      page,
      root,
      server,
      endpoint,
      received = [],
      mode = 'success';
    async function launch() {
      app = await _electron.launch(electronLaunchOptions(root));
      page = await app.firstWindow();
      await expect(page.getByTestId('composer-app')).toBeVisible();
    }
    async function saveText(text) {
      await page.getByLabel('正文编辑器').fill(text);
      await page.getByLabel('文档标题').click();
      await expect(page.getByTestId('save-status')).toHaveText(/已保存/);
    }
    async function newDocument(title, kind = 'chapter') {
      await page.getByRole('button', { name: '新建文档', exact: true }).click();
      const d = page.getByRole('dialog');
      await d.getByLabel('名称', { exact: true }).fill(title);
      await d.getByLabel('文档类型').selectOption(kind);
      await d.getByRole('button', { name: '创建', exact: true }).click();
      await expect(page.getByLabel('文档标题')).toHaveValue(title);
    }
    async function configureAI() {
      await page.getByRole('button', { name: '模型设置', exact: true }).click();
      const d = page.getByRole('dialog');
      await d.getByLabel('API 基础地址').fill(endpoint);
      await d.getByLabel('模型名称').fill('e2e-fixture');
      await d.getByLabel('API 密钥').fill('fixture-key-not-real');
      await d.getByRole('button', { name: '保存模型设置' }).click();
      await expect(d).not.toBeVisible();
    }
    server = http.createServer(async (req, res) => {
      let data = '';
      for await (const chunk of req) data += chunk;
      received.push(JSON.parse(data));
      if (mode === 'error') {
        res.statusCode = 429;
        res.end('{}');
        return;
      }
      const timer = setTimeout(
        () => {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              choices: [{ message: { content: '门外响了三下。林遥放下信，走到门边。' } }]
            })
          );
        },
        mode === 'slow' ? 10000 : 60
      );
      res.on('close', () => clearTimeout(timer));
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    endpoint = `http://127.0.0.1:${server.address().port}/v1`;
    const c = {
      get app() {
        return app;
      },
      get page() {
        return page;
      },
      get root() {
        return root;
      },
      get received() {
        return received;
      },
      set mode(value) {
        mode = value;
      },
      launch,
      saveText,
      newDocument,
      configureAI
    };
    try {
      root = await fs.mkdtemp(path.join(os.tmpdir(), 'composer-e2e-'));
      mode = 'success';
      received = [];
      await launch();
      await use(c);
    } finally {
      if (app) await app.close();
      if (root) await fs.rm(root, { recursive: true, force: true });
      await new Promise((resolve) => server.close(resolve));
    }
  }
});
module.exports = { test, expect };
