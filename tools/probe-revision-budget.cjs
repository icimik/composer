const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Store } = require('../electron/store.cjs');

async function resourceBytes(store, wid, docId) {
  const w = await store.workspace(wid);
  const doc = w.documents.find((item) => item.id === docId);
  const files = {
    manuscript: await store.docPath(wid, doc),
    manifest: store.manifestPath(wid),
    history: await store.protectedFile(wid, `.composer/history/${docId}.json`),
    audit: await store.protectedFile(wid, '08-operations/logs/changes.jsonl')
  };
  const sizes = {};
  for (const [kind, file] of Object.entries(files)) sizes[kind] = (await fs.stat(file)).size;
  return sizes;
}
async function measure(revisions, characters) {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'composer-budget-probe-'))
  );
  try {
    const store = new Store(path.join(root, 'data'));
    await store.init();
    const wid = store.registry.activeWorkspaceId;
    const w = await store.workspace(wid);
    let doc = w.documents[0];
    const content = (index) => String(index).padStart(4, '0') + 'x'.repeat(characters - 4);
    for (let index = 1; index <= revisions; index++) {
      doc = await store.saveDocument(
        wid,
        doc.id,
        'Synthetic size fixture',
        content(index),
        doc.hash
      );
    }
    const before = await resourceBytes(store, wid, doc.id);
    await store.saveDocument(wid, doc.id, doc.title, content(revisions + 1), doc.hash);
    const after = await resourceBytes(store, wid, doc.id);
    const total = (sizes) => Object.values(sizes).reduce((sum, bytes) => sum + bytes, 0);
    console.log(
      JSON.stringify({
        revisionsBefore: revisions,
        asciiCharactersPerRevision: characters,
        before,
        after,
        stagedImagesBytes: total(before) + total(after)
      })
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}
async function main() {
  await measure(16, 32768);
  await measure(64, 262144);
  await measure(32, 1048576);
  console.log(
    'Synthetic full-image byte estimates only; no resource policy or recovery implementation.'
  );
}
main().catch(() => {
  console.error('Synthetic budget probe failed; no raw path/manuscript/error is published.');
  process.exitCode = 1;
});
