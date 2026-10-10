const { test, expect } = require('../helpers/isolation-ui-fixture.cjs');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

for (const faulty of [false, true]) {
  test(`delayed proposal resolution keeps identity and inputs; current fault=${faulty}`, async ({
    isolation: c
  }) => {
    await c.store.switchWorkspace(c.a.id);
    const doc = c.a.documents[0];
    await c.store.addProposal(c.a.id, c.a.activeSessionId, {
      id: randomUUID(),
      docId: doc.id,
      baseHash: doc.hash,
      action: 'generate',
      text: '作者明确采纳的 A 合成提案',
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
    await c.launch();
    await expect(c.page.getByTestId('ai-proposal')).toBeVisible();
    await c.app.evaluate((_, manifest) => {
      const fs = process.getBuiltinModule('node:fs/promises');
      const read = fs.readFile;
      const gate = new Promise((resolve) => {
        globalThis.releaseProposalRead = resolve;
      });
      fs.readFile = async (file, ...args) => {
        if (file === manifest) {
          globalThis.proposalReadPending = true;
          await gate;
        }
        return read(file, ...args);
      };
    }, c.store.manifestPath(c.a.id));
    await c.page.getByRole('button', { name: '采纳', exact: true }).click();
    await expect.poll(() => c.app.evaluate(() => globalThis.proposalReadPending)).toBe(true);
    await expect(c.page.getByLabel('工作区', { exact: true })).toBeDisabled();
    await expect(c.page.getByRole('button', { name: '重试加载工作区' })).toBeDisabled();
    await expect(c.page.getByLabel('正文编辑器')).toBeDisabled();
    await c.page.evaluate((id) => {
      const select = document.getElementById('workspace-select');
      select.value = id;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }, c.b.id);
    await expect(c.page.getByRole('alert')).toContainText('正在切换或重试');
    let before;
    if (faulty) {
      await fs.writeFile(c.store.manifestPath(c.a.id), '{invalid');
      before = await c.inventory(c.a.path);
    }
    await c.app.evaluate(() => globalThis.releaseProposalRead());
    if (faulty) {
      await expect(c.page.getByRole('alert')).toContainText('有效 JSON');
      await expect(c.page.getByLabel('工作区', { exact: true })).toBeEnabled();
      await expect(c.page.getByLabel('正文编辑器')).toHaveValue('');
      await expect(c.page.getByLabel('工作区', { exact: true })).toHaveValue(c.a.id);
      await c.page.getByRole('button', { name: '重试加载工作区' }).click();
      await expect(c.page.getByRole('button', { name: '重试加载工作区' })).toBeEnabled();
      await expect(c.page.getByLabel('正文编辑器')).toBeDisabled();
      await expect(c.page.getByRole('button', { name: '采纳', exact: true })).toBeDisabled();
      expect(await c.inventory(c.a.path)).toEqual(before);
      expect(await fs.readFile(c.document, 'utf8')).toBe('');
      return;
    }
    await expect(c.page.getByLabel('正文编辑器')).toHaveValue('作者明确采纳的 A 合成提案');
    await expect(c.page.getByLabel('工作区', { exact: true })).toHaveValue(c.a.id);
    await expect(c.page.getByLabel('工作区', { exact: true })).toBeEnabled();
    await c.page.getByLabel('工作区', { exact: true }).selectOption(c.b.id);
    await expect(c.page.getByLabel('正文编辑器')).toHaveValue('');
    expect(
      await fs.readFile(path.join(c.a.path, '07-writing/chapters', `${doc.id}.md`), 'utf8')
    ).toBe('作者明确采纳的 A 合成提案');
    expect(await fs.readFile(c.document, 'utf8')).toBe('');
  });
}
