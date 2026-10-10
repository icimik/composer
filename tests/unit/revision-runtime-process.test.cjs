const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { Store } = require('../../electron/store.cjs');
const { audit } = require('../../electron/store/revisions/records.cjs');
const { setup, invoke } = require('../helpers/revision-runtime-fixture.cjs');
const { inventory } = require('../helpers/isolation-fixture.cjs');

const phases = [
  'staged:manuscript:after',
  'prepared',
  'commit',
  'installed:manuscript',
  'installed:manifest',
  'installed:history',
  'installed:audit',
  'complete',
  'cleanup:retired',
  'cleanup:retirement-flushed',
  'cleaned:intent.json',
  'cleanup:removed'
];
for (const kind of ['save', 'restore', 'accept']) {
  for (const phase of phases) {
    test(`production Store ${kind}/${phase}: restart gates, explicit recovery and duplicate identity`, async (t) => {
      const f = await setup(t, kind);
      const child = spawnSync(
        process.execPath,
        [
          path.resolve('tests/helpers/revision-runtime-child.cjs'),
          f.root,
          f.nonce,
          JSON.stringify(f.request),
          phase
        ],
        { encoding: 'utf8', timeout: 20000 }
      );
      assert.equal(child.status, 77, `status=${child.status}, signal=${child.signal}`);
      const before = await inventory(f.a.path);
      const store = new Store(path.join(f.root, 'data'));
      await store.init();
      const loaded = await store.load();
      assert.deepEqual(await inventory(f.a.path), before, 'startup never repairs');
      assert.equal(loaded.workspaces.find((w) => w.id === f.b.id).status, 'ready');
      const status = loaded.workspaces.find((w) => w.id === f.a.id);
      if (phase !== 'cleanup:removed') {
        assert.equal(status.diagnostic.code, 'revision-recovery-required');
        assert.equal(loaded.activeWorkspaceId, null);
        await assert.rejects(
          store.updateSession(f.a.id, f.a.activeSessionId, f.request.docId, 'No')
        );
      } else assert.equal(status.status, 'ready');
      if (phase.startsWith('staged:')) {
        await assert.rejects(store.revisionPreview(f.a.id));
        assert.deepEqual(await inventory(f.a.path), before);
        return;
      }
      if (phase !== 'cleanup:removed') {
        const preview = await store.revisionPreview(f.a.id);
        assert.equal(preview.operationId, f.request.operationId);
        assert.ok(!Object.hasOwn(preview, 'content'));
        assert.deepEqual(await inventory(f.a.path), before);
        await store.serial(() => store.applyRevision(f.a.id, preview.operationId));
      }
      await store.serial(() => store.applyRevision(f.a.id, f.request.operationId));
      if (phase === 'prepared') {
        assert.equal((await store.workspace(f.a.id)).documents[0].content, 'before');
        await store.serial(() => invoke(store, f.request));
      }
      const w = await store.workspace(f.a.id);
      assert.equal(w.documents[0].content, f.expected.content);
      assert.equal(w.documents[0].title, f.expected.title);
      if (kind === 'accept') assert.equal(w.sessions[0].proposals[0].status, 'accepted');
      const terminal = await inventory(f.a.path);
      await store.serial(() => invoke(store, f.request));
      assert.deepEqual(await inventory(f.a.path), terminal, 'same identity does not write again');
      const rows = audit(
        await fs.readFile(path.join(f.a.path, '08-operations/logs/changes.jsonl'))
      );
      assert.equal(rows.filter((r) => r.operationId === f.request.operationId).length, 1);
      assert.equal((await store.history(f.a.id, f.request.docId)).length, 2);
    });
  }
}
