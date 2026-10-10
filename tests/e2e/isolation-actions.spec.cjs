const { test, expect } = require('../helpers/isolation-ui-fixture.cjs');
const fs = require('node:fs/promises');
const path = require('node:path');

test('healthy retry preserves baseline hash and dirty input against external manuscript changes', async ({
  isolation: c
}) => {
  await c.store.switchWorkspace(c.a.id);
  await c.launch();
  await expect(c.page.getByLabel('正文编辑器')).toBeVisible();
  await c.page.clock.install();
  await c.page.getByLabel('正文编辑器').fill('作者未保存的合成输入');
  const file = path.join(c.a.path, '07-writing/chapters', `${c.a.documents[0].id}.md`);
  await fs.writeFile(file, '外部合成改稿');
  await c.page.getByRole('button', { name: '重试加载工作区' }).click();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('作者未保存的合成输入');
  await c.page.clock.runFor(1000);
  await expect(c.page.getByRole('alert')).toContainText('其他操作修改');
  expect(await fs.readFile(file, 'utf8')).toBe('外部合成改稿');
  await fs.writeFile(file, '');
});

test('suspended repair/reopen retains dirty baseline; external edits still conflict', async ({
  isolation: c
}) => {
  await c.store.switchWorkspace(c.a.id);
  await c.launch();
  await expect(c.page.getByLabel('正文编辑器')).toBeVisible();
  await c.page.clock.install();
  const manifest = c.store.manifestPath(c.a.id);
  const original = await fs.readFile(manifest);
  await c.page.getByLabel('正文编辑器').fill('只保留不覆盖的合成输入');
  await fs.writeFile(manifest, '{invalid');
  await c.page.getByRole('button', { name: '重试加载工作区' }).click();
  await expect(c.page.getByLabel('正文编辑器')).toBeDisabled();
  const file = path.join(c.a.path, '07-writing/chapters', `${c.a.documents[0].id}.md`);
  await fs.writeFile(file, '外部修复时修改的正文');
  await fs.writeFile(manifest, original);
  await c.page.getByRole('button', { name: '重试加载工作区' }).click();
  await c.page.getByRole('button', { name: '重新打开当前工作区' }).click();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('只保留不覆盖的合成输入');
  await c.page.clock.runFor(1000);
  await expect(c.page.getByRole('alert')).toContainText('其他操作修改');
  expect(await fs.readFile(file, 'utf8')).toBe('外部修复时修改的正文');
  await fs.writeFile(file, '');
});

test('explicit create/open remain usable beside an unrelated broken workspace', async ({
  isolation: c
}) => {
  await c.store.switchWorkspace(c.a.id);
  await fs.writeFile(c.manifest, '{invalid');
  const before = await c.inventory(c.b.path);
  await c.launch();
  await expect(c.page.getByTestId('workspace-fault')).toBeVisible();
  await c.page.getByRole('button', { name: '新建', exact: true }).click();
  const dialog = c.page.getByRole('dialog');
  await dialog.getByLabel('名称', { exact: true }).fill('作者明确新建的 C');
  await dialog.getByRole('button', { name: '创建', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await c.save('只属于 C 的合成正文');
  await c.app.evaluate(({ dialog }, root) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [root] });
  }, c.a.path);
  await c.page.getByRole('button', { name: '打开目录', exact: true }).click();
  await expect(c.page.getByLabel('工作区', { exact: true })).toHaveValue(c.a.id);
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('');
  expect(await c.inventory(c.b.path)).toEqual(before);
});

test('faulty current editor without dirty input still permits read-only commands and explicit new workspace', async ({
  isolation: c
}) => {
  await c.store.switchWorkspace(c.a.id);
  await c.launch();
  await expect(c.page.getByLabel('正文编辑器')).toBeVisible();
  await fs.writeFile(c.store.manifestPath(c.a.id), '{invalid');
  const before = await c.inventory(c.a.path);
  await c.page.getByRole('button', { name: '重试加载工作区' }).click();
  await expect(c.page.getByLabel('正文编辑器')).toBeDisabled();
  await c.page.keyboard.press('Control+k');
  await c.page.getByLabel('搜索操作').fill('保存');
  await expect(c.page.getByRole('button', { name: '保存当前文档', exact: true })).toBeDisabled();
  await c.page.getByLabel('搜索操作').fill('专注');
  await c.page.getByRole('button', { name: '切换专注模式', exact: true }).click();
  await expect(c.page.getByRole('dialog')).not.toBeVisible();
  await c.page.keyboard.press('Escape');
  await c.page.getByRole('button', { name: '使用说明', exact: true }).click();
  await expect(c.page.getByRole('dialog')).toContainText('会话保存');
  await c.page.getByRole('button', { name: '关闭对话框' }).click();
  await c.page.getByRole('button', { name: '新建', exact: true }).click();
  const dialog = c.page.getByRole('dialog');
  await dialog.getByLabel('名称', { exact: true }).fill('明确创建的独立新作品');
  await expect(dialog.getByRole('button', { name: '创建', exact: true })).toBeEnabled();
  await dialog.getByRole('button', { name: '创建', exact: true }).click();
  await expect(c.page.getByLabel('正文编辑器')).toBeEnabled();
  expect(await c.inventory(c.a.path)).toEqual(before);
});
