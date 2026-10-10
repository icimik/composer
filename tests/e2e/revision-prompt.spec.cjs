const { test, expect } = require('../helpers/revision-ui-fixture.cjs');
const fs = require('node:fs/promises');
const path = require('node:path');

test('prompt write failure after document commit preserves the returned baseline without a duplicate revision', async ({
  recovery: c
}) => {
  await c.launch();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('before');
  await c.app.evaluate(({ app }, wid) => {
    const path = process.getBuiltinModule('node:path');
    const require = process
      .getBuiltinModule('node:module')
      .createRequire(path.join(app.getAppPath(), 'package.json'));
    const { Store } = require('./electron/store.cjs');
    const { UserFacingError } = require('./electron/errors.cjs');
    const original = Store.prototype.updateSession;
    Store.prototype.updateSession = async function (...args) {
      if (args[0] === wid) {
        Store.prototype.updateSession = original;
        throw new UserFacingError('合成指令保存失败');
      }
      return original.apply(this, args);
    };
  }, c.a.id);
  await c.page.getByLabel('这一章要发生什么？').fill('第一次指令');
  await c.page.getByLabel('正文编辑器').fill('after');
  await expect(c.page.getByRole('alert')).toContainText('合成指令保存失败');
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('after');
  await c.page.getByLabel('这一章要发生什么？').fill('第二次指令');
  await expect(c.page.getByTestId('save-status')).toHaveText('已保存');
  const rows = (await fs.readFile(path.join(c.a.path, '08-operations/logs/changes.jsonl'), 'utf8'))
    .trim()
    .split('\n');
  expect(rows).toHaveLength(2);
  expect(await c.store.history(c.a.id, c.request.docId)).toHaveLength(2);
  expect((await c.store.workspace(c.a.id)).sessions[0].prompt).toBe('第二次指令');
});
