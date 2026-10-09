const { test, expect } = require('../helpers/composer-fixture.cjs');
const fs = require('node:fs/promises');
const path = require('node:path');
test('creates chapter, autosaves UTF-8, survives complete app restart', async ({ composer: c }) => {
  await c.page.getByLabel('文档标题').fill('第一章 雨');
  await c.saveText('雨停了。\n\n“信是你的。”');
  await c.app.close();
  await c.launch();
  await expect(c.page.getByLabel('文档标题')).toHaveValue('第一章 雨');
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('雨停了。\n\n“信是你的。”');
});
test('close flushes a pending draft without waiting for debounce', async ({ composer: c }) => {
  await c.page.getByLabel('正文编辑器').fill('关闭前刚输入的句子');
  await c.app.close();
  await c.launch();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('关闭前刚输入的句子');
});
test('workspaces isolate content and retain state when switching back', async ({ composer: c }) => {
  await c.saveText('甲作品私有正文');
  const first = await c.page.getByLabel('工作区', { exact: true }).inputValue();
  await c.page.getByRole('button', { name: '新建', exact: true }).click();
  const d = c.page.getByRole('dialog');
  await d.getByLabel('名称', { exact: true }).fill('乙作品');
  await d.getByRole('button', { name: '创建', exact: true }).click();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('');
  await c.saveText('乙作品私有正文');
  await c.page.getByLabel('工作区', { exact: true }).selectOption(first);
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('甲作品私有正文');
});
test('session switch restores independent prompts and document selection', async ({
  composer: c
}) => {
  await c.page.getByLabel('这一章要发生什么？').fill('甲会话的独立指令');
  await c.saveText('共有的正文');
  await c.page.getByRole('button', { name: '新建会话', exact: true }).click();
  const d = c.page.getByRole('dialog');
  await d.getByLabel('名称', { exact: true }).fill('修稿会话');
  await d.getByRole('button', { name: '创建', exact: true }).click();
  await expect(c.page.getByLabel('这一章要发生什么？')).toHaveValue('');
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('共有的正文');
  await c.page.getByRole('tab', { name: '创作会话', exact: true }).click();
  await expect(c.page.getByLabel('这一章要发生什么？')).toHaveValue('甲会话的独立指令');
});
test('creates all story asset types and displays overview', async ({ composer: c }) => {
  await c.newDocument('第二章');
  await c.saveText('第二章正文');
  await c.newDocument('林遥', 'character');
  await c.saveText('她在邮局工作。');
  await c.newDocument('雾港', 'world');
  await c.newDocument('故事大纲', 'outline');
  await c.newDocument('克制具体', 'style');
  await c.page.getByRole('button', { name: '结构总览', exact: true }).click();
  await expect(c.page.getByRole('heading', { name: '让故事有迹可循' })).toBeVisible();
  await expect(
    c.page
      .getByRole('button')
      .filter({ has: c.page.getByRole('heading', { name: '第二章', exact: true }) })
  ).toBeVisible();
});
test('stage and manual checks survive restart', async ({ composer: c }) => {
  await c.page.getByRole('button', { name: /阶段检查/ }).click();
  await c.page.getByLabel('当前阶段').selectOption('审阅');
  await c.page.getByLabel('中文表达自然').check();
  await c.app.close();
  await c.launch();
  await c.page.getByRole('button', { name: /阶段检查/ }).click();
  await expect(c.page.getByLabel('当前阶段')).toHaveValue('审阅');
  await expect(c.page.getByLabel('中文表达自然')).toBeChecked();
});
test('focus mode, panel toggle, theme and command palette', async ({ composer: c }) => {
  await c.page.getByRole('button', { name: '切换明暗主题' }).click();
  await expect(c.page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await c.page.getByRole('button', { name: '收起 AI 面板' }).click();
  await expect(c.page.getByLabel('AI 创作助手')).not.toBeVisible();
  await c.page.getByRole('button', { name: '展开 AI 面板' }).click();
  await expect(c.page.getByLabel('AI 创作助手')).toBeVisible();
  await c.page.keyboard.press('F8');
  await expect(c.page.getByLabel('工作区导航')).not.toBeVisible();
  await c.page.keyboard.press('Escape');
  await expect(c.page.getByLabel('工作区导航')).toBeVisible();
  await c.page.getByRole('button', { name: '打开命令面板' }).click();
  await c.page.getByLabel('搜索操作').fill('新建章节');
  await c.page.getByRole('button', { name: '新建章节', exact: true }).click();
  await expect(c.page.getByRole('dialog', { name: '新建文档' })).toBeVisible();
});
test('history restore is reversible', async ({ composer: c }) => {
  await c.saveText('版本甲');
  await c.saveText('版本乙');
  await c.page.getByRole('button', { name: '历史快照', exact: true }).click();
  const article = c.page.getByRole('dialog').locator('article').filter({ hasText: '版本甲' });
  await article.getByRole('button', { name: '恢复此版本' }).click();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('版本甲');
  await c.page.getByRole('button', { name: '历史快照', exact: true }).click();
  await expect(
    c.page.getByRole('dialog').locator('article').filter({ hasText: '版本乙' })
  ).toBeVisible();
  await fs.mkdir(path.resolve('docs/research/screenshots'), { recursive: true });
  await c.page.screenshot({ path: path.resolve('docs/research/screenshots/history.png') });
});
