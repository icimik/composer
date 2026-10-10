const { nameSchema, contentSchema } = require('../primitives.cjs');
const { validateMeta } = require('../reader.cjs');
const { UserFacingError } = require('../../errors.cjs');
const { json, text, hash, fail, fieldsSchema, parse, requestDigest } = require('./format.cjs');
const { history, audit } = require('./records.cjs');
const { createPlan, findCommitted } = require('./journal.cjs');
const layout = require('./disk-layout.cjs');
const io = require('./disk-io.cjs');
const disk = require('./disk.cjs');
const { cleanup } = require('./cleanup.cjs');
const { assertReady } = require('./pending.cjs');

async function mutate(root, request, policy, step = async () => {}) {
  await assertReady(root);
  await require('../reader.cjs').readWorkspace({ id: request.workspaceId, path: root });
  const raw = await io.read(root, '.composer/workspace.json', policy.maxStagedBytes);
  const meta = json(raw);
  validateMeta(meta);
  const doc = meta.documents.find((d) => d.id === request.documentId);
  if (!doc || meta.id !== request.workspaceId) fail('invalid-images');
  const fields = parse(
    fieldsSchema,
    {
      operationId: request.operationId,
      workspaceId: request.workspaceId,
      documentId: doc.id,
      documentKind: doc.kind,
      kind: request.kind,
      expectedHash: request.expectedHash,
      expectedTitle: request.expectedTitle,
      reason: request.reason,
      createdAt: new Date().toISOString(),
      sessionId: request.sessionId || null,
      proposalId: request.proposalId || null,
      snapshotId: request.snapshotId || null
    },
    'invalid-intent'
  );
  const before = await layout.current(root, fields, policy);
  // Capture the same manifest bytes used to select identity and baselines.
  if (!before.manifest?.equals(raw)) fail('baseline-conflict');
  const old = history(before.history);
  const events = audit(before.audit);
  const prior = events.find((r) => r.operationId === fields.operationId);
  let title = request.title;
  let content = request.content;
  let proposal;
  if (fields.kind === 'restore') {
    const snapshot = old.find((s) => s.id === fields.snapshotId);
    if (!snapshot) throw new UserFacingError('快照不存在。');
    title = snapshot.title;
    content = snapshot.content;
  }
  if (fields.kind === 'accept') {
    proposal = meta.sessions
      .find((s) => s.id === fields.sessionId)
      ?.proposals.find((p) => p.id === fields.proposalId);
    if (!proposal || proposal.docId !== doc.id || proposal.baseHash !== fields.expectedHash)
      fail('invalid-images');
    title = fields.expectedTitle;
    content = proposal.text;
    if (prior) content = text(before.manuscript);
    else if (proposal.action === 'continue')
      content = text(before.manuscript) + (before.manuscript.length ? '\n\n' : '') + proposal.text;
  }
  title = nameSchema.parse(title);
  content = contentSchema.parse(content);
  const contentHash = prior && fields.kind === 'accept' ? prior.afterHash : hash(content);
  const digest = requestDigest(fields, title, contentHash);
  const committed = findCommitted(
    before.audit,
    fields.operationId,
    digest,
    { title: doc.title, hash: hash(before.manuscript) },
    policy
  );
  if (committed) {
    if (
      prior.documentId !== doc.id ||
      prior.beforeHash !== fields.expectedHash ||
      prior.reason !== fields.reason ||
      (fields.kind === 'accept' && proposal.status !== 'accepted')
    )
      fail('invalid-images');
    if (committed.stale) fail('baseline-conflict');
    return { ...doc, content: text(before.manuscript), hash: hash(before.manuscript) };
  }
  if (fields.kind === 'accept' && proposal.status !== 'pending')
    throw new UserFacingError('提案不存在或已处理。');
  if (fields.kind === 'accept' && hash(before.manuscript) !== fields.expectedHash)
    throw new UserFacingError('正文已变化，不能采纳旧提案。请基于新正文重新生成。');
  if (hash(before.manuscript) !== fields.expectedHash || doc.title !== fields.expectedTitle)
    throw new UserFacingError('文稿已被其他操作修改。请重新打开后再保存，编辑区内容仍保留。');
  const next = structuredClone(meta);
  next.documents.find((d) => d.id === doc.id).title = title;
  if (proposal)
    next.sessions
      .find((s) => s.id === fields.sessionId)
      .proposals.find((p) => p.id === fields.proposalId).status = 'accepted';
  const snapshots = [...old];
  if (!before.manuscript.equals(Buffer.from(content)))
    snapshots.push({
      id: fields.operationId,
      title: fields.expectedTitle,
      content: text(before.manuscript),
      createdAt: fields.createdAt,
      reason: fields.reason
    });
  const event = {
    time: fields.createdAt,
    documentId: doc.id,
    title,
    reason: fields.reason,
    beforeHash: fields.expectedHash,
    afterHash: hash(content),
    operationId: fields.operationId
  };
  const prefix = before.audit === null ? '' : text(before.audit);
  const after = {
    manuscript: Buffer.from(content),
    manifest: Buffer.from(JSON.stringify(next, null, 2)),
    history:
      snapshots.length === old.length
        ? before.history
        : Buffer.from(JSON.stringify(snapshots, null, 2)),
    audit: Buffer.from(
      prefix + (prefix && !prefix.endsWith('\n') ? '\n' : '') + JSON.stringify(event) + '\n'
    )
  };
  const images = Object.fromEntries(
    Object.keys(after).map((kind) => [kind, { before: before[kind], after: after[kind] }])
  );
  const plan = createPlan(fields, images, policy, await io.available(root));
  await disk.execute(root, plan, policy, step);
  await cleanup(root, fields.operationId, policy, step);
  return { ...doc, title, content, hash: hash(content) };
}
module.exports = { mutate };
