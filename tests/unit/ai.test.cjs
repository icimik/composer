const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { Store, newId } = require('../../electron/store.cjs');
const { AI } = require('../../electron/ai.cjs');
const vault = {
  isEncryptionAvailable: () => true,
  getSelectedStorageBackend: () => 'unit-fixture',
  encryptString: (s) => Buffer.from(`fixture:${s}`),
  decryptString: (b) => b.toString().slice(8)
};
async function setup(t, handler) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'composer-ai-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const store = new Store(root);
  await store.init();
  const w = (await store.load()).workspaces[0].workspace;
  const server = http.createServer(
    handler ||
      ((req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ choices: [{ message: { content: '她关了灯。' } }] }));
      })
  );
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => new Promise((r) => server.close(r)));
  const endpoint = `http://127.0.0.1:${server.address().port}/v1`;
  const ai = new AI(store, vault, path.join(__dirname, '../../framework'), { allowTestHttp: true });
  return { store, w, ai, endpoint };
}
test('AI refuses requests before configuration', async (t) => {
  const { w, ai } = await setup(t);
  await assert.rejects(
    ai.generate(w.id, w.activeSessionId, w.documents[0].id, 'generate', '起笔', [], newId()),
    /尚未配置/
  );
});
test('settings never reveal key; production rejects plain HTTP', async (t) => {
  const { w, ai, endpoint, store } = await setup(t);
  const prod = new AI(store, vault, path.join(__dirname, '../../framework'));
  await assert.rejects(prod.configure(w.id, endpoint, 'test', 'secret'), /HTTPS/);
  await ai.configure(w.id, endpoint, 'fixture-model', 'unit-key');
  const s = await ai.settings(w.id);
  assert.equal(s.hasKey, true);
  assert.ok(!JSON.stringify(s).includes('unit-key'));
});
test('context includes only selected assets from originating workspace', async (t) => {
  let input;
  const { w, ai, store, endpoint } = await setup(t, async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    input = JSON.parse(raw);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ choices: [{ message: { content: '她推开门。' } }] }));
  });
  const note = await store.createDocument(w.id, '人物甲', 'character');
  await store.saveDocument(w.id, note.id, note.title, '所选秘密', note.hash);
  const hidden = await store.createDocument(w.id, '人物乙', 'character');
  await store.saveDocument(w.id, hidden.id, hidden.title, '未选秘密', hidden.hash);
  await ai.configure(w.id, endpoint, 'fixture-model', 'unit-key');
  const p = await ai.generate(
    w.id,
    w.activeSessionId,
    w.documents[0].id,
    'generate',
    '起笔',
    [note.id],
    newId()
  );
  const serialized = JSON.stringify(input);
  assert.match(serialized, /所选秘密/);
  assert.ok(!serialized.includes('未选秘密'));
  assert.match(serialized, /中文生成约束/);
  assert.equal(p.status, 'pending');
  assert.equal((await store.workspace(w.id)).documents[0].content, '');
});
test('provider authentication failure does not alter manuscript', async (t) => {
  const { w, ai, store, endpoint } = await setup(t, (_req, res) => {
    res.statusCode = 401;
    res.end('sensitive provider payload');
  });
  await ai.configure(w.id, endpoint, 'fixture', 'unit-key');
  await assert.rejects(
    ai.generate(w.id, w.activeSessionId, w.documents[0].id, 'generate', 'x', [], newId()),
    /鉴权失败/
  );
  assert.equal((await store.workspace(w.id)).sessions[0].proposals.length, 0);
});
test('empty response rejected', async (t) => {
  const { w, ai, endpoint } = await setup(t, (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end('{"choices":[]}');
  });
  await ai.configure(w.id, endpoint, 'fixture', 'unit-key');
  await assert.rejects(
    ai.generate(w.id, w.activeSessionId, w.documents[0].id, 'generate', 'x', [], newId()),
    /有效正文/
  );
});
test('cancellation prevents proposal creation', async (t) => {
  const { w, ai, store, endpoint } = await setup(t, (_req, res) => {
    const timer = setTimeout(
      () => res.end('{"choices":[{"message":{"content":"迟到的结果"}}]}'),
      200
    );
    res.on('close', () => clearTimeout(timer));
  });
  await ai.configure(w.id, endpoint, 'fixture', 'unit-key');
  const id = newId();
  const p = ai.generate(w.id, w.activeSessionId, w.documents[0].id, 'generate', 'x', [], id);
  await new Promise((r) => setTimeout(r, 50));
  ai.cancel(id);
  await assert.rejects(p, /取消|超时/);
  assert.equal((await store.workspace(w.id)).sessions[0].proposals.length, 0);
});
test('secure storage failure does not fall back to plaintext', async (t) => {
  const { w, store, endpoint } = await setup(t);
  const ai = new AI(
    store,
    { isEncryptionAvailable: () => false },
    path.join(__dirname, '../../framework'),
    { allowTestHttp: true }
  );
  await assert.rejects(ai.configure(w.id, endpoint, 'test', 'unit-key'), /安全存储不可用/);
  assert.equal((await ai.settings(w.id)).hasKey, false);
});
test('changing provider cannot silently reuse the previous key', async (t) => {
  const { w, ai, endpoint } = await setup(t);
  await ai.configure(w.id, endpoint, 'fixture', 'unit-key');
  await assert.rejects(
    ai.configure(w.id, 'https://different.example/v1', 'fixture', ''),
    /重新提供密钥/
  );
});
test('malformed provider JSON is a safe actionable error', async (t) => {
  const { w, ai, endpoint } = await setup(t, (_req, res) => res.end('private malformed payload'));
  await ai.configure(w.id, endpoint, 'fixture', 'unit-key');
  await assert.rejects(
    ai.generate(w.id, w.activeSessionId, w.documents[0].id, 'generate', 'x', [], newId()),
    /格式无效/
  );
});
