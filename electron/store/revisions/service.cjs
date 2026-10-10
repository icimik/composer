const { single, entries } = require('./pending.cjs');
const { fail, json } = require('./format.cjs');
const { inspect } = require('./recovery.cjs');
const layout = require('./disk-layout.cjs');
const io = require('./disk-io.cjs');
const disk = require('./disk.cjs');
const retired = require('./retired.cjs');
const { cleanup } = require('./cleanup.cjs');
const { decodeIntent } = require('./journal.cjs');

async function preview(root, workspaceId, policy) {
  const pending = await single(root);
  const operationId = pending.operationId;
  if (pending.retired) {
    const view = await retired.inspect(root, operationId, policy);
    if (view.names.length) {
      const bytes = await io.read(root, `${view.dir}/intent.json`, layout.metadataLimit);
      const intent = decodeIntent(bytes, { ...policy, maxStagedBytes: layout.metadataLimit });
      if (intent.workspaceId !== workspaceId) fail('invalid-intent');
    }
    return {
      operationId,
      title: '已验证修订的清理',
      kind: 'cleanup',
      phase: 'retired',
      action: 'cleanup-retired'
    };
  }
  const { plan, markers } = await layout.load(root, operationId, policy);
  if (plan.intent.workspaceId !== workspaceId) fail('invalid-intent');
  const observed = await layout.current(root, plan.intent, policy);
  const view = inspect(plan, observed, markers, policy);
  const title = json(plan.images.manifest.after).documents.find(
    (d) => d.id === plan.intent.documentId
  ).title;
  return { operationId, title, kind: plan.intent.kind, phase: view.phase, action: view.action };
}
async function apply(root, request, policy) {
  if (!(await entries(root)).length) {
    await require('../reader.cjs').readWorkspace({ id: request.workspaceId, path: root });
    return { status: 'absent' };
  }
  const view = await preview(root, request.workspaceId, policy);
  if (view.operationId !== request.operationId) fail('invalid-intent');
  if (view.action === 'conflict') fail('baseline-conflict');
  if (view.action === 'roll-forward') await disk.recover(root, view.operationId, policy);
  await cleanup(root, view.operationId, policy);
  return { status: 'resolved' };
}
module.exports = { preview, apply };
