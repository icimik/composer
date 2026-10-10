const { idSchema, nameSchema, newId } = require('./primitives.cjs');
const worker = require('./revisions/worker-runner.cjs');

module.exports = {
  async revisionWrite(request, revision) {
    const w = await this.workspace(request.workspaceId);
    const doc = w.documents.find((d) => d.id === idSchema.parse(request.documentId));
    if (!doc) throw new (require('../errors.cjs').UserFacingError)('找不到此文档。');
    const identity = revision || { operationId: newId(), expectedTitle: doc.title };
    const operationId = idSchema.parse(identity.operationId);
    const expectedTitle = nameSchema.parse(identity.expectedTitle);
    return worker.run('mutate', this.entry(w.id).path, { ...request, operationId, expectedTitle });
  },
  async revisionPreview(wid) {
    return worker.run('preview', this.entry(wid).path, { workspaceId: wid });
  },
  async applyRevision(wid, operationId) {
    idSchema.parse(operationId);
    return worker.run('apply', this.entry(wid).path, { workspaceId: wid, operationId });
  }
};
