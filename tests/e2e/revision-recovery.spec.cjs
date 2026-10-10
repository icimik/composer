const { test, expect } = require('../helpers/revision-ui-fixture.cjs');
const fs = require('node:fs/promises');
const path = require('node:path');
const { inventory } = require('../helpers/isolation-fixture.cjs');

for (const kind of ['save', 'restore', 'accept']) {
  test.describe(`real Electron ${kind} interruption`, () => {
    test.use({ revisionKind: kind });
    test('author input -> killed Store write -> preview/confirm -> explicit open/save/restart', async ({
      recovery: c
    }) => {
      await c.launch();
      await expect(c.page.getByLabel('正文编辑器')).toHaveValue('before');
      await c.interrupt('installed:manuscript');
      await c.crash(async () => {
        if (kind === 'save') {
          await c.page.getByLabel('文档标题').fill('New title');
          await c.page.getByLabel('正文编辑器').fill('after');
        } else if (kind === 'accept') {
          await c.page.getByRole('button', { name: '采纳', exact: true }).click();
        } else {
          await c.page.getByRole('button', { name: '历史快照', exact: true }).click();
          await c.page.getByRole('button', { name: '恢复此版本', exact: true }).click();
        }
      });
      const interrupted = await inventory(c.a.path);
      await c.launch();
      await expect(c.page.getByTestId('workspace-fault')).toContainText('未完成的修订');
      await expect(c.page.getByLabel('正文编辑器')).toHaveCount(0);
      expect(await inventory(c.a.path)).toEqual(interrupted);
      await c.page.getByRole('button', { name: '检查修订记录', exact: true }).click();
      expect(await inventory(c.a.path)).toEqual(interrupted);
      await c.confirm();
      await expect(c.page.getByLabel('正文编辑器')).toHaveCount(0);
      await c.chooseA();
      await expect(c.page.getByLabel('正文编辑器')).toHaveValue(c.expected.content);
      await expect(c.page.getByLabel('文档标题')).toHaveValue(c.expected.title);
      if (kind === 'accept') await expect(c.page.getByTestId('ai-proposal')).toHaveCount(0);
      await c.page.getByLabel('正文编辑器').fill('作者在恢复后明确保存的正文');
      await expect(c.page.getByTestId('save-status')).toHaveText('已保存');
      await c.close();
      await c.launch();
      await expect(c.page.getByLabel('正文编辑器')).toHaveValue('作者在恢复后明确保存的正文');
      const meta = JSON.parse(await fs.readFile(c.store.manifestPath(c.a.id), 'utf8'));
      if (kind === 'accept') expect(meta.sessions[0].proposals[0].status).toBe('accepted');
      const rows = (
        await fs.readFile(path.join(c.a.path, '08-operations/logs/changes.jsonl'), 'utf8')
      )
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line));
      expect(rows).toHaveLength(3);
      const history = await c.store.history(c.a.id, c.request.docId);
      expect(history).toHaveLength(3);
    });
  });
}
