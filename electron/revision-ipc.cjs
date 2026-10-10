const { z } = require('zod');
const { idSchema, nameSchema } = require('./store/primitives.cjs');

const identity = z.object({ operationId: idSchema, expectedTitle: nameSchema }).strict();
function revisionHandlers(store) {
  return {
    saveDocument: (wid, id, title, content, hash, reason, revision) =>
      store.serial(() =>
        store.saveDocument(wid, id, title, content, hash, reason, identity.parse(revision))
      ),
    restore: (wid, id, snapshotId, hash, revision) =>
      store.serial(() => store.restore(wid, id, snapshotId, hash, identity.parse(revision))),
    resolveProposal: (wid, sid, pid, accept, revision) =>
      store.serial(() =>
        store.resolveProposal(
          wid,
          sid,
          pid,
          z.boolean().parse(accept),
          accept ? identity.parse(revision) : undefined
        )
      ),
    revisionPreview: (wid) => store.serial(() => store.revisionPreview(idSchema.parse(wid))),
    applyRevision: (wid, operationId) =>
      store.serial(() => store.applyRevision(idSchema.parse(wid), idSchema.parse(operationId)))
  };
}
module.exports = { revisionHandlers };
