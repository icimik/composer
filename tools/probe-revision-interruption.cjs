const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { Store, hash, newId } = require('../electron/store.cjs');

const phases = [
  'history-installed',
  'manuscript-installed',
  'manifest-installed',
  'audit-appended',
  'proposal-before-status'
];
async function observe(store, wid, docId, pid) {
  const w = await store.workspace(wid);
  const doc = w.documents.find((item) => item.id === docId);
  const log = await store.protectedFile(wid, '08-operations/logs/changes.jsonl');
  const text = await fs.readFile(log, 'utf8');
  return {
    manuscript: doc.content === 'synthetic-before' ? 'before' : 'after',
    title: doc.title === 'Synthetic old title' ? 'before' : 'after',
    history: (await store.history(wid, docId)).length,
    audit: text.trim().split('\n').length,
    proposal: w.sessions[0].proposals.find((item) => item.id === pid).status
  };
}
async function probe(phase) {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'composer-revision-probe-'))
  );
  try {
    const data = path.join(root, 'data');
    const token = newId();
    await fs.writeFile(path.join(root, '.synthetic-probe'), token, { flag: 'wx', mode: 0o600 });
    const store = new Store(data);
    await store.init();
    const wid = store.registry.activeWorkspaceId;
    const w = await store.workspace(wid);
    const doc = w.documents[0];
    await store.saveDocument(wid, doc.id, 'Synthetic old title', 'synthetic-before', doc.hash);
    const pid = newId();
    await store.addProposal(wid, w.activeSessionId, {
      id: pid,
      docId: doc.id,
      baseHash: hash('synthetic-before'),
      action: 'generate',
      text: 'synthetic-after',
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
    const before = await observe(store, wid, doc.id, pid);
    const child = spawnSync(
      process.execPath,
      [
        path.join(__dirname, 'probe-revision-child.cjs'),
        data,
        phase,
        wid,
        doc.id,
        pid,
        hash('synthetic-before'),
        token
      ],
      { encoding: 'utf8', timeout: 10000 }
    );
    if (child.status !== 77) {
      console.error(JSON.stringify({ phase, status: child.status, signal: child.signal }));
      throw new Error('Synthetic child did not reach the interruption');
    }
    const restart = new Store(data);
    await restart.init();
    const results = await restart.load();
    assert.equal(results.workspaces[0].status, 'ready');
    const after = await observe(restart, wid, doc.id, pid);
    const expected = {
      'history-installed': ['before', 'before', 2, 1, 'pending'],
      'manuscript-installed': ['after', 'before', 2, 1, 'pending'],
      'manifest-installed': ['after', 'after', 2, 1, 'pending'],
      'audit-appended': ['after', 'after', 2, 2, 'pending'],
      'proposal-before-status': ['after', 'before', 2, 2, 'pending']
    };
    assert.deepEqual(Object.values(after), expected[phase]);
    console.log(
      JSON.stringify({ phase, childExit: child.status, restart: 'ready', before, after })
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}
async function main() {
  for (const phase of phases) await probe(phase);
  console.log(
    '5 baseline interruption probes observed; no recovery implementation or power-loss claim.'
  );
}
main().catch(() => {
  console.error('Synthetic baseline probe failed; no raw path/manuscript/error is published.');
  process.exitCode = 1;
});
