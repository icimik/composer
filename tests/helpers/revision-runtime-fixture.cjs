const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { fixture } = require('./isolation-fixture.cjs');

async function setup(t, kind = 'save') {
  const f = await fixture(t);
  const root = await fs.realpath(f.root);
  await f.store.switchWorkspace(f.a.id);
  const d = f.a.documents[0];
  await f.store.saveDocument(f.a.id, d.id, 'Old title', 'before', d.hash);
  const before = await f.store.workspace(f.a.id);
  const doc = before.documents[0];
  const snapshot = (await f.store.history(before.id, doc.id))[0];
  const proposalId = randomUUID();
  if (kind === 'accept')
    await f.store.addProposal(before.id, before.activeSessionId, {
      id: proposalId,
      docId: doc.id,
      baseHash: doc.hash,
      action: 'generate',
      text: 'after',
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
  const nonce = randomUUID();
  await fs.writeFile(path.join(f.root, '.revision-ownership'), nonce, { flag: 'wx' });
  const request = {
    kind,
    wid: before.id,
    docId: doc.id,
    expectedHash: doc.hash,
    expectedTitle: doc.title,
    operationId: randomUUID(),
    sessionId: before.activeSessionId,
    proposalId,
    snapshotId: snapshot.id
  };
  return {
    ...f,
    root,
    nonce,
    request,
    expected: {
      content: kind === 'restore' ? snapshot.content : 'after',
      title: kind === 'restore' ? snapshot.title : kind === 'accept' ? doc.title : 'New title'
    }
  };
}
function invoke(store, request) {
  const r = request;
  const identity = { operationId: r.operationId, expectedTitle: r.expectedTitle };
  if (r.kind === 'save')
    return store.saveDocument(
      r.wid,
      r.docId,
      'New title',
      'after',
      r.expectedHash,
      undefined,
      identity
    );
  if (r.kind === 'restore')
    return store.restore(r.wid, r.docId, r.snapshotId, r.expectedHash, identity);
  return store.resolveProposal(r.wid, r.sessionId, r.proposalId, true, identity);
}
module.exports = { setup, invoke };
