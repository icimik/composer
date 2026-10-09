const { test, expect } = require('../helpers/composer-fixture.cjs');
const fs = require('node:fs/promises');
const path = require('node:path');
test('AI unconfigured state shows actionable error without mutation', async ({ composer: c }) => {
  await c.page.getByLabel('这一章要发生什么？').fill('写一个开场');
  await c.page.getByRole('button', { name: '生成正文提案' }).click();
  await expect(c.page.getByRole('alert')).toContainText('尚未配置 AI');
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('');
});
test('AI actual HTTP adapter generates proposal, only acceptance changes text', async ({
  composer: c
}) => {
  await c.configureAI();
  await c.page.getByLabel('这一章要发生什么？').fill('林遥收到了信');
  await c.page.getByRole('button', { name: '生成正文提案' }).click();
  await expect(c.page.getByTestId('ai-proposal')).toBeVisible();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('');
  await fs.mkdir(path.resolve('docs/research/screenshots'), { recursive: true });
  await c.page.screenshot({ path: path.resolve('docs/research/screenshots/ai-proposal.png') });
  await c.page.getByRole('button', { name: '采纳', exact: true }).click();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('门外响了三下。林遥放下信，走到门边。');
  expect(c.received[0].messages[0].content).toContain('中文生成约束');
  const settings = await c.page.evaluate(async () => {
    const s = await window.composer.load();
    return window.composer.getSettings(s.activeWorkspaceId);
  });
  expect(JSON.stringify(settings)).not.toContain('fixture-key-not-real');
});
test('AI context includes selected assets, not another workspace', async ({ composer: c }) => {
  await c.configureAI();
  await c.newDocument('林遥', 'character');
  await c.saveText('她是邮局唯一的员工。');
  await c.page.getByRole('button', { name: /01.*第一章/ }).click();
  await c.page.getByRole('button', { name: /参考设定/ }).click();
  await c.page.getByLabel('林遥', { exact: true }).check();
  await c.page.getByLabel('这一章要发生什么？').fill('起笔');
  await c.page.getByRole('button', { name: '生成正文提案' }).click();
  await expect(c.page.getByTestId('ai-proposal')).toBeVisible();
  expect(c.received[0].messages[1].content).toContain('她是邮局唯一的员工。');
});
test('polishing is whole-chapter proposal and stale result is rejected', async ({
  composer: c
}) => {
  await c.configureAI();
  await c.saveText('原始正文');
  await c.page.getByRole('button', { name: '优化表达', exact: true }).click();
  await c.page.getByLabel('希望怎样调整表达？').fill('保留结构，让动作具体');
  await c.page.getByRole('button', { name: '生成优化提案' }).click();
  await expect(c.page.getByTestId('ai-proposal')).toBeVisible();
  await c.saveText('作者后来改动了正文');
  await c.page.getByRole('button', { name: '采纳', exact: true }).click();
  await expect(c.page.getByRole('alert')).toContainText('正文已变化');
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('作者后来改动了正文');
  await c.page.screenshot({
    path: path.resolve('docs/research/screenshots/stale-proposal-error.png')
  });
});
test('continuation appends once, discard leaves draft unchanged', async ({ composer: c }) => {
  await c.configureAI();
  await c.saveText('雨停了。');
  await c.page.getByRole('button', { name: '续写', exact: true }).click();
  await c.page.getByLabel('这一章要发生什么？').fill('有人敲门');
  await c.page.getByRole('button', { name: '生成正文提案' }).click();
  await expect(c.page.getByTestId('ai-proposal')).toBeVisible();
  await c.page.getByRole('button', { name: '放弃', exact: true }).click();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('雨停了。');
  await c.page.getByRole('button', { name: '生成正文提案' }).click();
  await expect(c.page.getByTestId('ai-proposal')).toBeVisible();
  await c.page.getByRole('button', { name: '采纳', exact: true }).click();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue(
    '雨停了。\n\n门外响了三下。林遥放下信，走到门边。'
  );
});
test('AI errors and cancel do not mutate document or create proposals', async ({ composer: c }) => {
  await c.configureAI();
  await c.page.getByLabel('这一章要发生什么？').fill('起笔');
  c.mode = 'error';
  await c.page.getByRole('button', { name: '生成正文提案' }).click();
  await expect(c.page.getByRole('alert')).toContainText('请求受限');
  c.mode = 'slow';
  await c.page.getByRole('button', { name: '生成正文提案' }).click();
  await expect(c.page.getByRole('button', { name: '取消生成' })).toBeVisible();
  await c.page.getByRole('button', { name: '取消生成' }).click();
  await expect(c.page.getByRole('alert')).toContainText('取消');
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('');
  await expect(c.page.getByTestId('ai-proposal')).toHaveCount(0);
});
