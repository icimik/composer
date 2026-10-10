const { test, expect } = require('../helpers/composer-fixture.cjs');
const fs = require('node:fs/promises');
const path = require('node:path');
test('external edit conflict preserves external content and current unsaved input', async ({
  composer: c
}) => {
  const s = await c.page.evaluate(() => window.composer.load());
  const w = s.workspaces[0].workspace;
  const doc = w.documents[0];
  await fs.writeFile(
    path.join(w.path, '07-writing/chapters', doc.id + '.md'),
    '外部作者的改稿',
    'utf8'
  );
  await c.page.getByLabel('正文编辑器').fill('当前编辑区的改稿');
  await expect(c.page.getByRole('alert')).toContainText('其他操作修改');
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('当前编辑区的改稿');
  expect(await fs.readFile(path.join(w.path, '07-writing/chapters', doc.id + '.md'), 'utf8')).toBe(
    '外部作者的改稿'
  );
  // Restore the external file solely so teardown can flush without intentionally blocking close.
  await fs.writeFile(path.join(w.path, '07-writing/chapters', doc.id + '.md'), '', 'utf8');
});
test('renderer cannot access Node; untrusted text is never executed', async ({ composer: c }) => {
  expect(await c.page.evaluate(() => typeof window.require)).toBe('undefined');
  await c.saveText('<script>window.hacked=true</script>');
  expect(await c.page.evaluate(() => window.hacked)).toBeUndefined();
  const result = await c.app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0];
    return win.webContents.getLastWebPreferences();
  });
  expect(result.nodeIntegration).toBe(false);
  expect(result.contextIsolation).toBe(true);
  expect(result.sandbox).toBe(true);
});
test('export UI writes only manuscript through the save dialog', async ({ composer: c }) => {
  await c.saveText('仅导出这个正文');
  await c.newDocument('秘密角色', 'character');
  await c.saveText('这段资料不导出');
  const output = path.join(c.root, 'export.md');
  await c.app.evaluate(({ dialog }, output) => {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: output });
  }, output);
  await c.page.getByRole('button', { name: /导出文稿/ }).click();
  await expect(c.page.getByRole('status').filter({ hasText: '已导出' })).toBeVisible();
  const text = await fs.readFile(output, 'utf8');
  expect(text).toContain('仅导出这个正文');
  expect(text).not.toContain('这段资料不导出');
});
test('open directory UI restores an existing local workspace', async ({ composer: c }) => {
  await c.saveText('已有目录里的正文');
  const s = await c.page.evaluate(() => window.composer.load());
  const original = s.workspaces[0].workspace;
  await c.page.getByRole('button', { name: '新建', exact: true }).click();
  const d = c.page.getByRole('dialog');
  await d.getByLabel('名称', { exact: true }).fill('临时切换');
  await d.getByRole('button', { name: '创建', exact: true }).click();
  await c.app.evaluate(({ dialog }, folder) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [folder] });
  }, original.path);
  await c.page.getByRole('button', { name: '打开目录', exact: true }).click();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('已有目录里的正文');
});
test('reading size and palette change presentation but never manuscript', async ({
  composer: c
}) => {
  await c.saveText('正文不能随主题改变。');
  await c.page.getByLabel('阅读字号').selectOption('large');
  await c.page.getByLabel('配色方案').selectOption('mono');
  await expect(c.page.locator('html')).toHaveAttribute('data-scheme', 'mono');
  await expect(c.page.locator('.writing-area')).toHaveClass(/large/);
  await c.page.getByLabel('阅读字号').selectOption('standard');
  await c.page.getByLabel('配色方案').selectOption('pine');
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('正文不能随主题改变。');
  await c.page.getByRole('button', { name: '使用说明', exact: true }).click();
  await expect(c.page.getByRole('dialog')).toContainText('会话保存');
});
test('invalid settings report error inside modal and preserve the draft', async ({
  composer: c
}) => {
  await c.saveText('保留稿件');
  await c.page.getByRole('button', { name: '模型设置', exact: true }).click();
  const d = c.page.getByRole('dialog');
  await d.getByLabel('API 基础地址').fill('http://unsafe.example/v1');
  await d.getByLabel('模型名称').fill('fixture');
  await d.getByLabel('API 密钥').fill('fixture-key-not-real');
  await d.getByRole('button', { name: '保存模型设置' }).click();
  await expect(d.getByRole('alert')).toContainText('HTTPS');
  await d.getByRole('button', { name: '关闭对话框' }).click();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('保留稿件');
});
test('child frame cannot invoke privileged workspace operations', async ({ composer: c }) => {
  await c.page.evaluate(() => {
    const f = document.createElement('iframe');
    f.id = 'untrusted-frame';
    f.src = 'composer://app/';
    document.body.appendChild(f);
  });
  await expect(c.page.frameLocator('#untrusted-frame').getByTestId('composer-app')).toBeAttached();
  const handle = await c.page.locator('#untrusted-frame').elementHandle();
  const frame = await handle.contentFrame();
  expect(await frame.evaluate(() => typeof window.composer)).toBe('undefined');
  expect(await frame.evaluate(() => typeof window.require)).toBe('undefined');
  await expect(c.page.locator('#root').getByLabel('正文编辑器')).toHaveValue('');
});
