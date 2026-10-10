const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { Store } = require('../electron/store.cjs');

async function main() {
  const [root, phase, wid, docId, proposalId, expectedHash, token] = process.argv.slice(2);
  if (!root || !phase || !wid || !docId || !expectedHash)
    throw Error('Missing synthetic probe args');
  const parent = await fs.realpath(path.dirname(root));
  const temp = await fs.realpath(os.tmpdir());
  if (
    !/^composer-revision-probe-[^/\\]+$/.test(path.relative(temp, parent)) ||
    root !== path.join(parent, 'data') ||
    !token ||
    (await fs.readFile(path.join(parent, '.synthetic-probe'), 'utf8')) !== token
  )
    throw Error('Refusing non-owned synthetic fixture');
  const store = new Store(root);
  await store.init();
  const workspace = await store.workspace(wid);
  const manifest = store.manifestPath(wid);
  const doc = workspace.documents.find((item) => item.id === docId);
  const manuscript = await store.docPath(wid, doc);
  const history = path.join(workspace.path, '.composer/history', `${docId}.json`);
  const audit = path.join(workspace.path, '08-operations/logs/changes.jsonl');
  const rename = fs.rename;
  const append = fs.appendFile;
  const stop = () => process.exit(77);
  // This child receives only a parent-owned synthetic fixture, never a user workspace.
  fs.rename = async (source, destination) => {
    const result = await rename(source, destination);
    if (phase === 'history-installed' && destination === history) stop();
    if (phase === 'manuscript-installed' && destination === manuscript) stop();
    if (phase === 'manifest-installed' && destination === manifest) stop();
    return result;
  };
  fs.appendFile = async (file, ...args) => {
    const result = await append(file, ...args);
    if (phase === 'audit-appended' && file === audit) stop();
    return result;
  };
  if (phase === 'proposal-before-status') {
    const writeMeta = store.writeMeta;
    let writes = 0;
    store.writeMeta = async (...args) => {
      if (++writes === 2) stop();
      return writeMeta.apply(store, args);
    };
    await store.serial(() =>
      store.resolveProposal(wid, workspace.activeSessionId, proposalId, true)
    );
  } else {
    await store.serial(() =>
      store.saveDocument(wid, docId, 'Synthetic new title', 'synthetic-after', expectedHash)
    );
  }
  throw Error('Requested interruption was not reached');
}
main().catch(() => {
  console.error(
    'Synthetic interruption probe failed; inspect locally without publishing raw errors.'
  );
  process.exitCode = 1;
});
