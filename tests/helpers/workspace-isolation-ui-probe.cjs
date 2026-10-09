// Real Electron pre-fix evidence, deliberately outside the default E2E spec glob.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { _electron, expect } = require('@playwright/test');
const { Store } = require('../../electron/store.cjs');
const { electronLaunchOptions } = require('./electron-launch.cjs');
const { inventory } = require('./workspace-isolation-probe.cjs');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'composer-isolation-ui-'));
  let app;
  try {
    const store = new Store(path.join(root, 'data'));
    await store.init();
    const a = (await store.load()).workspaces[0];
    const state = await store.createWorkspace('合成故障作品 B');
    const b = state.workspaces.find((w) => w.id !== a.id);
    const manifest = store.manifestPath(b.id);
    const original = await fs.readFile(manifest);
    await fs.writeFile(manifest, '{invalid');
    const before = await inventory(b.path);
    app = await _electron.launch(electronLaunchOptions(root));
    let page = await app.firstWindow();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByTestId('composer-app')).toHaveCount(0);
    await expect(page.getByLabel('工作区', { exact: true })).toHaveCount(0);
    assert.deepEqual(await inventory(b.path), before);
    console.log('startup B active: alert only; no healthy selector/editor; failed bytes unchanged');
    await app.close();
    app = null;

    // Repair only synthetic input so the current UI can demonstrate a failed switch.
    await fs.writeFile(manifest, original);
    await store.switchWorkspace(a.id);
    app = await _electron.launch(electronLaunchOptions(root));
    page = await app.firstWindow();
    await expect(page.getByTestId('composer-app')).toBeVisible();
    await fs.writeFile(manifest, '{invalid');
    await page.getByLabel('正文编辑器').fill('合成未保存正文 A');
    await page.getByLabel('文档标题').fill('合成标题 A');
    await page.getByLabel('这一章要发生什么？').fill('合成指令 A');
    await page.getByLabel('工作区', { exact: true }).selectOption(b.id);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('正文编辑器')).toHaveValue('合成未保存正文 A');
    await expect(page.getByLabel('文档标题')).toHaveValue('合成标题 A');
    await expect(page.getByLabel('这一章要发生什么？')).toHaveValue('合成指令 A');
    const registry = JSON.parse(await fs.readFile(path.join(root, 'data/registry.json'), 'utf8'));
    assert.equal(registry.activeWorkspaceId, b.id);
    const aFile = path.join(a.path, '07-writing/chapters', `${a.documents[0].id}.md`);
    assert.equal(await fs.readFile(aFile, 'utf8'), '合成未保存正文 A');
    assert.equal(await fs.readFile(manifest, 'utf8'), '{invalid');
    const selected = await page.getByLabel('工作区', { exact: true }).inputValue();
    assert.equal(selected, a.id);
    console.log(
      `failed switch: input retained; A flushed; registry=B; native select=${selected === a.id ? 'A' : 'B'}`
    );
    await app.close();
    app = null;

    // Both are now damaged: still no independent diagnosis/explicit retry.
    await fs.writeFile(store.manifestPath(a.id), '{invalid');
    app = await _electron.launch(electronLaunchOptions(root));
    page = await app.firstWindow();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByTestId('composer-app')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /重试/ })).toHaveCount(0);
    console.log(
      'all-failed startup: alert only; no explicit retry; not a capability acceptance pass'
    );
  } finally {
    if (app) await app.close();
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
