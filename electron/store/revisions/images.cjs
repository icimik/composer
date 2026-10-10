const { validateMeta } = require('../reader.cjs');
const { contentSchema } = require('../primitives.cjs');
const { json, text, equal, hash, fail, parse } = require('./format.cjs');
const { history, verifyRecords } = require('./records.cjs');

function inspectImages(fields, images, digest) {
  if (
    !Buffer.isBuffer(images.manuscript.before) ||
    !Buffer.isBuffer(images.manuscript.after) ||
    !Buffer.isBuffer(images.manifest.before) ||
    !Buffer.isBuffer(images.manifest.after)
  )
    fail('invalid-images');
  const before = json(images.manifest.before);
  const after = json(images.manifest.after);
  try {
    validateMeta(before);
    validateMeta(after);
  } catch {
    fail('invalid-images');
  }
  const doc = before.documents.find((d) => d.id === fields.documentId);
  const next = after.documents.find((d) => d.id === fields.documentId);
  if (
    before.id !== fields.workspaceId ||
    after.id !== fields.workspaceId ||
    !doc ||
    !next ||
    doc.kind !== fields.documentKind ||
    next.kind !== fields.documentKind
  )
    fail('invalid-images');
  if (doc.title !== fields.expectedTitle || hash(images.manuscript.before) !== fields.expectedHash)
    fail('baseline-conflict');
  parse(contentSchema, text(images.manuscript.before), 'invalid-images');
  parse(contentSchema, text(images.manuscript.after), 'invalid-images');
  const restored = structuredClone(after);
  restored.documents.find((d) => d.id === fields.documentId).title = doc.title;
  if (fields.kind === 'accept') {
    const session = before.sessions.find((s) => s.id === fields.sessionId);
    const proposal = session?.proposals.find((p) => p.id === fields.proposalId);
    const nextSession = restored.sessions.find((s) => s.id === fields.sessionId);
    const resolved = nextSession?.proposals.find((p) => p.id === fields.proposalId);
    if (
      before.activeSessionId !== fields.sessionId ||
      session?.documentId !== doc.id ||
      !proposal ||
      proposal.docId !== doc.id ||
      proposal.status !== 'pending' ||
      proposal.baseHash !== fields.expectedHash ||
      resolved?.status !== 'accepted' ||
      !['generate', 'continue', 'polish'].includes(proposal.action) ||
      next.title !== doc.title
    )
      fail('invalid-images');
    const content =
      proposal.action === 'continue'
        ? text(images.manuscript.before) +
          (images.manuscript.before.length ? '\n\n' : '') +
          proposal.text
        : proposal.text;
    if (text(images.manuscript.after) !== content) fail('invalid-images');
    resolved.status = 'pending';
  }
  if (!equal(restored, before)) fail('invalid-images');
  if (fields.kind === 'restore') {
    const snapshot = history(images.history.before).find((s) => s.id === fields.snapshotId);
    if (
      !snapshot ||
      next.title !== snapshot.title ||
      text(images.manuscript.after) !== snapshot.content
    )
      fail('invalid-images');
  }
  if (digest) verifyRecords(fields, images, next.title, digest);
  return { title: next.title, contentHash: hash(images.manuscript.after) };
}
module.exports = { inspectImages };
