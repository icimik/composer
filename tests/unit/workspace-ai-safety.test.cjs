const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { AI } = require('../../electron/ai.cjs');
const { newId } = require('../../electron/store.cjs');
const { fixture } = require('../helpers/isolation-fixture.cjs');
const vault = {
  isEncryptionAvailable: () => true,
  getSelectedStorageBackend: () => 'unit-fixture',
  encryptString: (value) => Buffer.from(value),
  decryptString: (value) => value.toString()
};
test('fault during mock AI request prevents proposal commit and later requests/config writes', async (t) => {
  const f = await fixture(t);
  let requests = 0;
  const server = http.createServer(async (_, response) => {
    requests++;
    await fs.rm(f.document);
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ choices: [{ message: { content: '合成候选正文' } }] }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const endpoint = `http://127.0.0.1:${server.address().port}/v1`;
  const ai = new AI(f.store, vault, path.join(__dirname, '../../framework'), {
    allowTestHttp: true
  });
  await ai.configure(f.b.id, endpoint, 'mock', 'synthetic-not-real');
  const meta = await fs.readFile(f.manifest);
  const configPath = path.join(f.root, 'data/credentials', `${f.b.id}.json`);
  const config = await fs.readFile(configPath);
  const generate = () =>
    ai.generate(
      f.b.id,
      f.b.activeSessionId,
      f.b.documents[0].id,
      'generate',
      '合成指令',
      [],
      newId()
    );
  await assert.rejects(generate(), /文稿文件缺失/);
  await assert.rejects(generate(), /文稿文件缺失/);
  await assert.rejects(
    ai.configure(f.b.id, endpoint, 'cannot-write', 'synthetic-not-real'),
    /文稿文件缺失/
  );
  assert.equal(requests, 1);
  assert.deepEqual(await fs.readFile(f.manifest), meta);
  assert.deepEqual(await fs.readFile(configPath), config);
});
