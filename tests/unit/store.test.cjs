const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Store, hash, newId } = require('../../electron/store.cjs');
async function setup(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'composer-unit-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const store = new Store(root);
  await store.init();
  const s = await store.load();
  const w = s.workspaces[0].workspace;
  return { store, root, w, d: w.documents[0] };
}
test('creates a local workspace and blank chapter', async (t) => {
  const { w, d } = await setup(t);
  assert.equal(w.sessions.length, 1);
  assert.equal(d.content, '');
  assert.equal(d.hash, hash(''));
});
test('persists exact UTF-8 manuscript and title through restart', async (t) => {
  const { store, root, w, d } = await setup(t);
  await store.saveDocument(w.id, d.id, '第1章 雨', '雨停了。\n\n“回家吧。”', d.hash);
  const next = new Store(root);
  await next.init();
  const loaded = await next.workspace(w.id);
  assert.equal(loaded.documents[0].content, '雨停了。\n\n“回家吧。”');
  assert.equal(loaded.documents[0].title, '第1章 雨');
});
test('workspace content and sessions remain isolated', async (t) => {
  const { store, w, d } = await setup(t);
  await store.saveDocument(w.id, d.id, d.title, '秘密甲', d.hash);
  const s = await store.createWorkspace('第二部小说');
  const b = s.workspaces.find((x) => x.id !== w.id).workspace;
  assert.equal(b.documents[0].content, '');
  assert.equal(b.sessions[0].proposals.length, 0);
  assert.equal((await store.workspace(w.id)).documents[0].content, '秘密甲');
});
test('session preserves prompt and document but shares one manuscript', async (t) => {
  const { store, w, d } = await setup(t);
  const sid = w.activeSessionId;
  await store.updateSession(w.id, sid, d.id, '对白要短');
  const next = await store.createSession(w.id, '审阅会话');
  assert.equal(next.sessions[1].prompt, '');
  await store.saveDocument(w.id, d.id, d.title, '同一份正文', d.hash);
  const back = await store.switchSession(w.id, sid);
  assert.equal(back.sessions[0].prompt, '对白要短');
  assert.equal(back.documents[0].content, '同一份正文');
});
test('stale revision cannot overwrite external file edits', async (t) => {
  const { store, w, d } = await setup(t);
  await fs.writeFile(await store.docPath(w.id, d), '外部修改', 'utf8');
  await assert.rejects(store.saveDocument(w.id, d.id, d.title, '覆盖尝试', d.hash), /其他操作修改/);
  assert.equal((await store.workspace(w.id)).documents[0].content, '外部修改');
});
test('saved history is reversible and does not create .bak copies', async (t) => {
  const { store, w, d } = await setup(t);
  const a = await store.saveDocument(w.id, d.id, d.title, '版本甲', d.hash);
  await store.saveDocument(w.id, d.id, d.title, '版本乙', a.hash);
  const list = await store.history(w.id, d.id);
  const restored = await store.restore(w.id, d.id, list[1].id, hash('版本乙'));
  assert.equal(restored.content, '版本甲');
  const recent = await store.history(w.id, d.id);
  assert.equal(recent.at(-1).content, '版本乙');
});
test('AI proposal is not applied until accepted; acceptance logs and snapshots', async (t) => {
  const { store, w, d } = await setup(t);
  const p = {
    id: newId(),
    docId: d.id,
    baseHash: d.hash,
    action: 'generate',
    text: '她推开门。',
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  await store.addProposal(w.id, w.activeSessionId, p);
  assert.equal((await store.workspace(w.id)).documents[0].content, '');
  const next = await store.resolveProposal(w.id, w.activeSessionId, p.id, true);
  assert.equal(next.documents[0].content, p.text);
  assert.equal(next.sessions[0].proposals[0].status, 'accepted');
  assert.equal((await store.history(w.id, d.id)).length, 1);
});
test('stale AI proposal cannot overwrite new draft', async (t) => {
  const { store, w, d } = await setup(t);
  const p = {
    id: newId(),
    docId: d.id,
    baseHash: d.hash,
    action: 'polish',
    text: '旧提案',
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  await store.addProposal(w.id, w.activeSessionId, p);
  await store.saveDocument(w.id, d.id, d.title, '作者的新稿', d.hash);
  await assert.rejects(store.resolveProposal(w.id, w.activeSessionId, p.id, true), /正文已变化/);
  assert.equal((await store.workspace(w.id)).documents[0].content, '作者的新稿');
});
test('discarded proposal never modifies manuscript', async (t) => {
  const { store, w, d } = await setup(t);
  const p = {
    id: newId(),
    docId: d.id,
    baseHash: d.hash,
    action: 'generate',
    text: '不会采纳',
    createdAt: new Date().toISOString(),
    status: 'pending'
  };
  await store.addProposal(w.id, w.activeSessionId, p);
  const next = await store.resolveProposal(w.id, w.activeSessionId, p.id, false);
  assert.equal(next.documents[0].content, '');
  assert.equal(next.sessions[0].proposals[0].status, 'discarded');
});
test('invalid IDs and cross-workspace references rejected', async (t) => {
  const { store, w } = await setup(t);
  assert.throws(() => store.entry('../../secrets'));
  await assert.rejects(store.updateSession(w.id, w.activeSessionId, newId(), 'x'), /不属于/);
});
test('export contains chapters only, in manuscript order', async (t) => {
  const { store, w, d } = await setup(t);
  await store.saveDocument(w.id, d.id, '第1章', '第一章正文', d.hash);
  const note = await store.createDocument(w.id, '秘密设定', 'character');
  await store.saveDocument(w.id, note.id, note.title, '不应导出', note.hash);
  const text = await store.exportText(w.id);
  assert.match(text, /第一章正文/);
  assert.ok(!text.includes('不应导出'));
});
test('corrupt registry is reported, not reset or overwritten', async (t) => {
  const { root } = await setup(t);
  await fs.writeFile(path.join(root, 'registry.json'), '{bad');
  await assert.rejects(new Store(root).init(), /索引损坏/);
  assert.equal(await fs.readFile(path.join(root, 'registry.json'), 'utf8'), '{bad');
});
test('document symlinks cannot read or overwrite external files', async (t) => {
  const { store, root, w, d } = await setup(t);
  if (process.platform === 'win32') {
    t.skip('requires symlink privilege');
    return;
  }
  const file = await store.docPath(w.id, d);
  const outside = path.join(root, 'outside.md');
  await fs.writeFile(outside, 'private');
  await fs.rm(file);
  await fs.symlink(outside, file);
  await assert.rejects(store.workspace(w.id), /符号链接/);
  assert.equal(await fs.readFile(outside, 'utf8'), 'private');
});
test('serialized concurrent mutations preserve both documents', async (t) => {
  const { store, w } = await setup(t);
  await Promise.all(
    ['甲', '乙'].map((title) => store.serial(() => store.createDocument(w.id, title, 'chapter')))
  );
  assert.equal((await store.workspace(w.id)).documents.length, 3);
});
test('opening a registered workspace retains its identity and data', async (t) => {
  const { store, w, d } = await setup(t);
  await store.saveDocument(w.id, d.id, d.title, '现有目录正文', d.hash);
  const state = await store.openWorkspace(w.path);
  assert.equal(state.activeWorkspaceId, w.id);
  assert.equal(state.workspaces.length, 1);
  assert.equal(state.workspaces[0].workspace.documents[0].content, '现有目录正文');
});
test('internal metadata symlinks cannot escape the workspace', async (t) => {
  const { store, root, w } = await setup(t);
  if (process.platform === 'win32') {
    t.skip('requires symlink privilege');
    return;
  }
  const outside = path.join(root, 'outside.json');
  await fs.writeFile(outside, 'private');
  const target = path.join(w.path, '.composer', 'workspace.json');
  await fs.rm(target);
  await fs.symlink(outside, target);
  await assert.rejects(store.workspace(w.id), /符号链接/);
});
