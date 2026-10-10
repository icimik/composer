const { test, expect } = require('../helpers/isolation-ui-fixture.cjs');
const fs = require('node:fs/promises');
const path = require('node:path');

test('failed switch preserves unsaved body/title/prompt, active identity and faulty bytes', async ({
  isolation: c
}) => {
  await c.store.switchWorkspace(c.a.id);
  await c.launch();
  await expect(c.page.getByLabel('正文编辑器')).toBeVisible();
  await fs.writeFile(c.manifest, '{invalid');
  const before = await c.inventory(c.b.path);
  await c.page.getByLabel('正文编辑器').fill('切换失败也保留 A 输入');
  await c.page.getByLabel('文档标题').fill('A 合成标题');
  await c.page.getByLabel('这一章要发生什么？').fill('A 合成指令');
  await c.page.getByLabel('工作区', { exact: true }).selectOption(c.b.id);
  await expect(c.page.getByRole('alert')).toContainText('有效 JSON');
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('切换失败也保留 A 输入');
  await expect(c.page.getByLabel('文档标题')).toHaveValue('A 合成标题');
  await expect(c.page.getByLabel('这一章要发生什么？')).toHaveValue('A 合成指令');
  await expect(c.page.getByLabel('工作区', { exact: true })).toHaveValue(c.a.id);
  const registry = JSON.parse(await fs.readFile(path.join(c.root, 'data/registry.json'), 'utf8'));
  expect(registry.activeWorkspaceId).toBe(c.a.id);
  expect(await c.inventory(c.b.path)).toEqual(before);
  await c.close();
  await c.launch();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('切换失败也保留 A 输入');
});

test('retry suspends newly faulty editor without replacing dirty inputs or silently leaving them', async ({
  isolation: c
}) => {
  await c.store.switchWorkspace(c.a.id);
  await c.launch();
  await expect(c.page.getByLabel('正文编辑器')).toBeVisible();
  await c.page.clock.install({ time: new Date('2026-10-10T00:00:00Z') });
  await c.page.clock.pauseAt(new Date('2026-10-10T00:01:00Z'));
  const file = c.store.manifestPath(c.a.id);
  const original = await fs.readFile(file);
  await c.page.getByLabel('正文编辑器').fill('重试必须保留的未保存输入');
  await fs.writeFile(file, '{invalid');
  await c.page.getByRole('button', { name: '重试加载工作区' }).click();
  await expect(c.page.getByRole('button', { name: '重试加载工作区' })).toBeEnabled();
  await expect(c.page.getByLabel('正文编辑器')).toBeDisabled();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('重试必须保留的未保存输入');
  await c.page.keyboard.press('Control+s');
  await expect(c.page.getByRole('alert')).toContainText('当前工作区不可写');
  await c.page.getByLabel('工作区', { exact: true }).selectOption(c.b.id);
  await expect(c.page.getByRole('alert')).toContainText('未保存输入');
  await expect(c.page.getByLabel('工作区', { exact: true })).toHaveValue(c.a.id);
  await fs.writeFile(file, original);
  await c.page.getByRole('button', { name: '重试加载工作区' }).click();
  await expect(c.page.getByLabel('正文编辑器')).toBeDisabled();
  await c.page.getByRole('button', { name: '重新打开当前工作区' }).click();
  await expect(c.page.getByLabel('正文编辑器')).toBeEnabled();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('重试必须保留的未保存输入');
  await c.page.clock.runFor(1000);
  await expect(c.page.getByTestId('save-status')).toHaveText(/已保存/);
});

test('transition locks inputs and rejects overlapping selection until validated success', async ({
  isolation: c
}) => {
  await c.store.switchWorkspace(c.a.id);
  await c.launch();
  await expect(c.page.getByLabel('正文编辑器')).toBeVisible();
  await c.app.evaluate((_, manifest) => {
    const fs = process.getBuiltinModule('node:fs/promises');
    const read = fs.readFile;
    fs.readFile = async (file, ...args) => {
      if (file === manifest) await new Promise((resolve) => setTimeout(resolve, 800));
      return read(file, ...args);
    };
  }, c.manifest);
  await c.page.getByLabel('正文编辑器').fill('只属于 A 的转换前输入');
  await c.page.getByLabel('工作区', { exact: true }).selectOption(c.b.id);
  await expect(c.page.getByLabel('正文编辑器')).toBeDisabled();
  await expect(c.page.getByLabel('工作区', { exact: true })).toBeDisabled();
  await c.page.evaluate((id) => {
    const select = document.getElementById('workspace-select');
    select.value = id;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, c.a.id);
  await expect(c.page.getByLabel('工作区', { exact: true })).toHaveValue(c.b.id);
  await expect(c.page.getByLabel('正文编辑器')).toBeEnabled();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('');
  const aFile = path.join(c.a.path, '07-writing/chapters', `${c.a.documents[0].id}.md`);
  expect(await fs.readFile(aFile, 'utf8')).toBe('只属于 A 的转换前输入');
  expect(await fs.readFile(c.document, 'utf8')).toBe('');
});

test('flush conflict aborts switching and preserves both external content and current input', async ({
  isolation: c
}) => {
  await c.store.switchWorkspace(c.a.id);
  await c.launch();
  await expect(c.page.getByLabel('正文编辑器')).toBeVisible();
  const file = path.join(c.a.path, '07-writing/chapters', `${c.a.documents[0].id}.md`);
  await fs.writeFile(file, '外部合成改稿');
  await c.page.getByLabel('正文编辑器').fill('编辑区合成改稿');
  await c.page.getByLabel('工作区', { exact: true }).selectOption(c.b.id);
  await expect(c.page.getByRole('alert')).toContainText('其他操作修改');
  await expect(c.page.getByLabel('工作区', { exact: true })).toHaveValue(c.a.id);
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('编辑区合成改稿');
  expect(await fs.readFile(file, 'utf8')).toBe('外部合成改稿');
  const registry = JSON.parse(await fs.readFile(path.join(c.root, 'data/registry.json'), 'utf8'));
  expect(registry.activeWorkspaceId).toBe(c.a.id);
  // Repair synthetic fixture baseline solely so teardown can safely flush.
  await fs.writeFile(file, '');
});
