const fs = require('node:fs/promises');
const { workspaceSchema, folders, hash } = require('./primitives.cjs');
const { guardedFile } = require('./paths.cjs');
const { WorkspaceFault, fault } = require('./diagnostics.cjs');

function validateMeta(value) {
  let meta;
  try {
    meta = workspaceSchema.parse(value);
  } catch {
    throw new WorkspaceFault('invalid-manifest');
  }
  const docs = new Set(meta.documents.map((d) => d.id));
  const sessions = new Set(meta.sessions.map((s) => s.id));
  if (
    docs.size !== meta.documents.length ||
    sessions.size !== meta.sessions.length ||
    !sessions.has(meta.activeSessionId) ||
    meta.sessions.some(
      (s) =>
        !docs.has(s.documentId) ||
        new Set(s.proposals.map((p) => p.id)).size !== s.proposals.length ||
        s.proposals.some((p) => !docs.has(p.docId))
    )
  )
    throw new WorkspaceFault('invalid-manifest');
  return meta;
}
async function readMeta(root) {
  let text;
  try {
    text = await fs.readFile(await guardedFile(root, '.composer/workspace.json'), 'utf8');
  } catch (error) {
    throw fault(error, 'missing-manifest');
  }
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new WorkspaceFault('invalid-json');
  }
  return validateMeta(value);
}
async function readWorkspace(entry) {
  const meta = await readMeta(entry.path);
  if (entry.id && meta.id !== entry.id) throw new WorkspaceFault('invalid-manifest');
  const documents = await Promise.all(
    meta.documents.map(async (doc) => {
      try {
        const file = await guardedFile(entry.path, `${folders[doc.kind]}/${doc.id}.md`);
        const content = await fs.readFile(file, 'utf8');
        return { ...doc, content, hash: hash(content) };
      } catch (error) {
        throw fault(error, 'missing-document');
      }
    })
  );
  return { ...meta, path: entry.path, documents };
}
module.exports = { readMeta, readWorkspace, validateMeta };
