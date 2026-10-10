const { test, expect } = require('../helpers/revision-ui-fixture.cjs');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { mutate } = require('../../electron/store/revisions/mutation.cjs');
const { resourcePolicy } = require('../../electron/store/revisions/resource-policy.cjs');
const { inventory } = require('../helpers/isolation-fixture.cjs');

async function pending(c, phase = 'commit') {
  await expect(
    mutate(
      c.a.path,
      {
        kind: 'save',
        workspaceId: c.a.id,
        documentId: c.request.docId,
        title: 'New title',
        content: 'after',
        expectedHash: c.request.expectedHash,
        expectedTitle: c.request.expectedTitle,
        operationId: c.request.operationId,
        reason: '手动保存'
      },
      resourcePolicy,
      async (step) => {
        if (step === phase) throw Error('Owned synthetic interruption');
      }
    )
  ).rejects.toThrow();
}
async function pause(c) {
  await c.page.clock.install({ time: new Date('2026-10-10T00:00:00Z') });
  await c.page.clock.pauseAt(new Date('2026-10-10T00:01:00Z'));
}
test('dirty suspended editor survives preview/apply/reopen with its old baseline and refuses overwrite', async ({
  recovery: c
}) => {
  await c.launch();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('before');
  await pause(c);
  await c.page.getByLabel('正文编辑器').fill('未保存正文');
  await c.page.getByLabel('文档标题').fill('未保存标题');
  await c.page.getByLabel('这一章要发生什么？').fill('未保存指令');
  await pending(c);
  await c.page.getByRole('button', { name: '重试加载工作区' }).click();
  await expect(c.page.getByLabel('正文编辑器')).toBeDisabled();
  await c.confirm();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('未保存正文');
  await expect(c.page.getByLabel('文档标题')).toHaveValue('未保存标题');
  await expect(c.page.getByLabel('这一章要发生什么？')).toHaveValue('未保存指令');
  await expect(c.page.getByLabel('正文编辑器')).toBeDisabled();
  await c.page.getByRole('button', { name: '重新打开当前工作区' }).click();
  await expect(c.page.getByLabel('正文编辑器')).toBeEnabled();
  await c.page.keyboard.press('Control+s');
  await expect(c.page.getByRole('alert')).toContainText('其他操作修改');
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('未保存正文');
  expect(
    await fs.readFile(path.join(c.a.path, '07-writing/chapters', `${c.request.docId}.md`), 'utf8')
  ).toBe('after');
});
test('recovering A does not flush, select or replace healthy B unsaved input', async ({
  recovery: c
}) => {
  await pending(c);
  await c.store.switchWorkspace(c.b.id);
  await c.launch();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('');
  await pause(c);
  await c.page.getByLabel('正文编辑器').fill('属于 B 的未保存输入');
  await c.confirm();
  await expect(c.page.getByLabel('工作区', { exact: true })).toHaveValue(c.b.id);
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('属于 B 的未保存输入');
  expect(await fs.readFile(c.document, 'utf8')).toBe('');
});
test('third-value conflict offers no overwrite action; preview and retry preserve evidence', async ({
  recovery: c
}) => {
  await pending(c);
  const file = path.join(c.a.path, '07-writing/chapters', `${c.request.docId}.md`);
  await fs.writeFile(file, '外部合成修改');
  const before = await inventory(c.a.path);
  await c.launch();
  await c.page.getByRole('button', { name: '检查修订记录', exact: true }).click();
  await expect(c.page.getByText('文件与修订镜像冲突，不能自动覆盖。请保留现场。')).toBeVisible();
  await expect(c.page.getByRole('button', { name: '完成已提交的修订', exact: true })).toHaveCount(
    0
  );
  await c.page.getByRole('button', { name: '重试加载工作区' }).click();
  expect(await inventory(c.a.path)).toEqual(before);
});
for (const phase of ['prepared', 'cleanup:retired']) {
  test(`${phase} requires explicit cleanup and never fabricates a recovered body`, async ({
    recovery: c
  }) => {
    await pending(c, phase);
    await c.launch();
    await expect(c.page.getByLabel('正文编辑器')).toHaveCount(0);
    await c.confirm(false);
    await expect(c.page.getByLabel('正文编辑器')).toHaveCount(0);
    await c.chooseA();
    await expect(c.page.getByLabel('正文编辑器')).toHaveValue(
      phase === 'prepared' ? 'before' : 'after'
    );
  });
}
test('an unchanged suspended editor loads canonical after-state only on explicit reopen', async ({
  recovery: c
}) => {
  await c.launch();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('before');
  await pending(c);
  await c.page.getByRole('button', { name: '重试加载工作区' }).click();
  await expect(c.page.getByLabel('正文编辑器')).toBeDisabled();
  await c.confirm();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('before');
  await c.page.getByRole('button', { name: '重新打开当前工作区' }).click();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('after');
  await expect(c.page.getByLabel('文档标题')).toHaveValue('New title');
});
test('all pending workspaces show diagnostics; explicit A recovery preserves pending B', async ({
  recovery: c
}) => {
  const b = await c.store.workspace(c.b.id);
  const doc = b.documents[0];
  let interrupted = false;
  await expect(
    mutate(
      b.path,
      {
        kind: 'save',
        workspaceId: b.id,
        documentId: doc.id,
        title: doc.title,
        content: '属于 B 的待提交正文',
        expectedHash: doc.hash,
        expectedTitle: doc.title,
        operationId: randomUUID(),
        reason: '手动保存'
      },
      resourcePolicy,
      async (step) => {
        if (step === 'commit') {
          interrupted = true;
          throw Error('Owned synthetic interruption');
        }
      }
    )
  ).rejects.toMatchObject({ code: 'io-failure' });
  expect(interrupted).toBe(true);
  await pending(c);
  const beforeB = await inventory(c.b.path);
  await c.launch();
  await expect(c.page.getByTestId('workspace-fault')).toHaveCount(2);
  await expect(c.page.getByLabel('正文编辑器')).toHaveCount(0);
  await c.confirm();
  await expect(c.page.getByTestId('workspace-fault')).toHaveCount(1);
  await expect(c.page.getByLabel('正文编辑器')).toHaveCount(0);
  expect(await inventory(c.b.path)).toEqual(beforeB);
  await c.chooseA();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('after');
  expect(await inventory(c.b.path)).toEqual(beforeB);
});
