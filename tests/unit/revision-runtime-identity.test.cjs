const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { setup, invoke } = require('../helpers/revision-runtime-fixture.cjs');
const { inventory } = require('../helpers/isolation-fixture.cjs');

test('captured external title baseline refuses without staging or canonical writes', async (t) => {
  const f = await setup(t);
  const file = f.store.manifestPath(f.a.id);
  const meta = JSON.parse(await fs.readFile(file, 'utf8'));
  meta.documents[0].title = 'External title';
  await fs.writeFile(file, JSON.stringify(meta, null, 2));
  const before = await inventory(f.a.path);
  await assert.rejects(invoke(f.store, f.request), /其他操作修改/);
  assert.deepEqual(await inventory(f.a.path), before);
});
test('operation reuse with changed request or stale result never overwrites later author data', async (t) => {
  const f = await setup(t);
  await invoke(f.store, f.request);
  const r = f.request;
  const options = { operationId: r.operationId, expectedTitle: r.expectedTitle };
  const before = await inventory(f.a.path);
  await assert.rejects(
    f.store.saveDocument(
      r.wid,
      r.docId,
      'New title',
      'Changed request',
      r.expectedHash,
      undefined,
      options
    ),
    (e) => e.code === 'operation-conflict'
  );
  assert.deepEqual(await inventory(f.a.path), before);
  const current = (await f.store.workspace(r.wid)).documents[0];
  await f.store.saveDocument(r.wid, r.docId, current.title, 'Later author data', current.hash);
  const later = await inventory(f.a.path);
  await assert.rejects(invoke(f.store, r), (e) => e.code === 'baseline-conflict');
  assert.deepEqual(await inventory(f.a.path), later);
});
test('long accepted continuation replays its committed result without appending or revalidating twice', async (t) => {
  const f = await setup(t, 'accept');
  const meta = await f.store.writableMeta(f.a.id);
  const proposal = meta.sessions
    .find((s) => s.id === f.request.sessionId)
    .proposals.find((p) => p.id === f.request.proposalId);
  proposal.action = 'continue';
  proposal.text = 'x'.repeat(1_100_000);
  await f.store.writeMeta(f.a.id, meta);
  const first = await invoke(f.store, f.request);
  const expected = 'before\n\n' + proposal.text;
  assert.equal(first.documents[0].content, expected);
  const before = await inventory(f.a.path);
  const repeated = await invoke(f.store, f.request);
  assert.equal(repeated.documents[0].content, expected);
  assert.deepEqual(await inventory(f.a.path), before);
});
