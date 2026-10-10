const { hash } = require('../../electron/store.cjs');
function fixture(kind = 'save') {
  const fields = {
    operationId: 'operation-a',
    workspaceId: 'workspace-a',
    documentId: 'document-a',
    documentKind: 'chapter',
    kind,
    expectedHash: hash('before'),
    expectedTitle: 'Old title',
    reason: 'Synthetic revision',
    createdAt: '2026-10-10T00:00:00.000Z',
    sessionId: kind === 'accept' ? 'session-a' : null,
    proposalId: kind === 'accept' ? 'proposal-a' : null,
    snapshotId: kind === 'restore' ? 'snapshot-a' : null
  };
  const meta = {
    version: 1,
    id: 'workspace-a',
    name: 'Synthetic',
    stage: 'draft',
    target: 80000,
    documents: [{ id: 'document-a', title: 'Old title', kind: 'chapter' }],
    sessions: [
      {
        id: 'session-a',
        name: 'Session',
        documentId: 'document-a',
        prompt: '',
        proposals: [
          {
            id: 'proposal-a',
            docId: 'document-a',
            baseHash: hash('before'),
            action: 'generate',
            text: 'after',
            createdAt: fields.createdAt,
            status: 'pending'
          }
        ]
      }
    ],
    activeSessionId: 'session-a',
    checks: []
  };
  const next = structuredClone(meta);
  const title = kind === 'accept' ? 'Old title' : 'New title';
  next.documents[0].title = title;
  if (kind === 'accept') next.sessions[0].proposals[0].status = 'accepted';
  const history =
    kind === 'restore'
      ? [
          {
            id: 'snapshot-a',
            title: 'New title',
            content: 'after',
            createdAt: fields.createdAt,
            reason: 'Synthetic earlier revision'
          }
        ]
      : [];
  const snapshot = {
    id: fields.operationId,
    title: 'Old title',
    content: 'before',
    createdAt: fields.createdAt,
    reason: fields.reason
  };
  const event = {
    time: fields.createdAt,
    documentId: fields.documentId,
    title,
    reason: fields.reason,
    beforeHash: fields.expectedHash,
    afterHash: hash('after'),
    operationId: fields.operationId
  };
  const buffer = (value) => Buffer.from(JSON.stringify(value, null, 2));
  return {
    fields,
    images: {
      manuscript: { before: Buffer.from('before'), after: Buffer.from('after') },
      manifest: { before: buffer(meta), after: buffer(next) },
      history: { before: buffer(history), after: buffer([...history, snapshot]) },
      audit: { before: null, after: Buffer.from(JSON.stringify(event) + '\n') }
    },
    policy: { maxStagedBytes: 1000000, minFreeBytes: 1000 },
    availableBytes: 10000000
  };
}
module.exports = { fixture };
