const { test, expect } = require('../helpers/isolation-ui-fixture.cjs');
const fs = require('node:fs/promises');
const path = require('node:path');

test('mixed startup: diagnostic, healthy edit/save and full restart preserve faulty inventory', async ({
  isolation: c
}) => {
  await c.store.switchWorkspace(c.a.id);
  await fs.writeFile(c.manifest, '{synthetic private excerpt');
  const before = await c.inventory(c.b.path);
  await c.launch();
  await expect(c.page.getByTestId('workspace-fault')).toContainText(c.b.name);
  await expect(c.page.getByTestId('workspace-fault')).toContainText(c.b.id);
  await expect(c.page.getByTestId('workspace-fault')).not.toContainText(
    'synthetic private excerpt'
  );
  await expect(c.page.getByTestId('workspace-fault')).not.toContainText(c.b.path);
  await c.save('合成健康作品。\n重启后不变。');
  await c.close();
  await c.launch();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('合成健康作品。\n重启后不变。');
  await expect(c.page.getByTestId('workspace-fault')).toBeVisible();
  expect(await c.inventory(c.b.path)).toEqual(before);
  const registry = JSON.parse(await fs.readFile(path.join(c.root, 'data/registry.json'), 'utf8'));
  expect(registry.workspaces).toHaveLength(2);
});

test('broken last active: explicit healthy selection without fake blank B', async ({
  isolation: c
}, testInfo) => {
  await fs.writeFile(c.manifest, '{"version":');
  await c.launch();
  await expect(c.page.getByTestId('workspace-fault')).toContainText('有效 JSON');
  await expect(c.page.getByLabel('正文编辑器')).toHaveCount(0);
  await c.page.screenshot({ path: testInfo.outputPath('broken-active-diagnostics.png') });
  expect(c.store.registry.activeWorkspaceId).toBe(c.b.id);
  await c.chooseA();
  await c.save('明确选中的 A');
  await c.close();
  await c.launch();
  await expect(c.page.getByLabel('工作区', { exact: true })).toHaveValue(c.a.id);
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('明确选中的 A');
});

test('all failed: missing manifest stays absent; external repair + explicit retry + selection saves safely', async ({
  isolation: c
}) => {
  const aManifest = c.store.manifestPath(c.a.id);
  const original = await fs.readFile(aManifest);
  await fs.rm(aManifest);
  await fs.rm(c.document);
  const before = await c.inventory(c.b.path);
  await c.launch();
  await expect(c.page.getByTestId('workspace-fault')).toHaveCount(2);
  await expect(c.page.getByLabel('正文编辑器')).toHaveCount(0);
  await c.page.getByRole('button', { name: '重试加载工作区' }).click();
  await expect(c.page.getByTestId('workspace-fault')).toHaveCount(2);
  await expect(fs.access(aManifest)).rejects.toThrow();
  expect(await c.inventory(c.b.path)).toEqual(before);
  await fs.writeFile(aManifest, original);
  await c.page.getByRole('button', { name: '重试加载工作区' }).click();
  await expect(c.page.getByTestId('workspace-fault')).toHaveCount(1);
  await expect(c.page.getByLabel('正文编辑器')).toHaveCount(0);
  await c.chooseA();
  await c.save('修复后由作者选择，不自动补空稿');
  await c.close();
  await c.launch();
  await expect(c.page.getByLabel('正文编辑器')).toHaveValue('修复后由作者选择，不自动补空稿');
  expect(await c.inventory(c.b.path)).toEqual(before);
});

test('missing manuscript rejects direct fault IPC writes and AI settings before side effects', async ({
  isolation: c
}) => {
  await c.store.switchWorkspace(c.a.id);
  await fs.rm(c.document);
  const before = await c.inventory(c.b.path);
  await c.launch();
  await expect(c.page.getByTestId('workspace-fault')).toContainText('文稿文件缺失');
  const results = await c.page.evaluate(
    async ({ wid, sid, docId, hash }) => {
      const attempts = [
        () => window.composer.saveDocument(wid, docId, '不写', '不写', hash),
        () => window.composer.createDocument(wid, '不写', 'chapter'),
        () => window.composer.updateSession(wid, sid, docId, '不写'),
        () =>
          window.composer.setSettings(
            wid,
            'https://example.invalid/v1',
            'mock',
            'synthetic-not-real'
          )
      ];
      return Promise.all(
        attempts.map(async (attempt) => {
          try {
            await attempt();
            return 'unexpected success';
          } catch {
            return 'rejected';
          }
        })
      );
    },
    {
      wid: c.b.id,
      sid: c.b.activeSessionId,
      docId: c.b.documents[0].id,
      hash: c.b.documents[0].hash
    }
  );
  expect(results).toEqual(['rejected', 'rejected', 'rejected', 'rejected']);
  expect(await c.inventory(c.b.path)).toEqual(before);
  await expect(
    fs.access(path.join(c.root, 'data/credentials', `${c.b.id}.json`))
  ).rejects.toThrow();
});

test('deterministic main-process read denial renders a sanitized fault, healthy editor remains usable', async ({
  isolation: c
}) => {
  await c.store.switchWorkspace(c.a.id);
  await c.launch();
  await expect(c.page.getByLabel('正文编辑器')).toBeVisible();
  await c.app.evaluate((_, manifest) => {
    const fs = process.getBuiltinModule('node:fs/promises');
    const read = fs.readFile;
    fs.readFile = async (file, ...args) => {
      if (file === manifest)
        throw Object.assign(new Error('private injected detail'), { code: 'EACCES' });
      return read(file, ...args);
    };
  }, c.manifest);
  await c.page.getByRole('button', { name: '重试加载工作区' }).click();
  await expect(c.page.getByTestId('workspace-fault')).toContainText('权限');
  await expect(c.page.getByTestId('workspace-fault')).not.toContainText('private injected detail');
  await c.save('B 权限故障不影响 A');
});
