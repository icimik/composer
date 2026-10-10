const {
  kinds,
  fieldsSchema,
  completeSchema,
  fail,
  parse,
  policy,
  json,
  describe,
  bounded,
  requestDigest,
  freeze,
  hash,
  equal
} = require('./format.cjs');
const { inspectImages } = require('./images.cjs');
const { stamp } = require('./records.cjs');
const { findCommitted } = require('./identity.cjs');

function marker(plan, phase) {
  if (!['commit', 'complete'].includes(phase)) fail('invalid-marker');
  return freeze({
    version: 1,
    operationId: plan.intent.operationId,
    phase,
    intentHash: hash(JSON.stringify(plan.intent))
  });
}
function validatePlan(plan, resourcePolicy) {
  const p = policy(resourcePolicy);
  const intent = parse(completeSchema, plan?.intent, 'invalid-intent');
  const bytes = bounded(plan.images, p.maxStagedBytes);
  for (const resource of intent.resources) {
    for (const side of ['before', 'after']) {
      if (!equal(resource[side], describe(plan.images[resource.kind][side])))
        fail('payload-mismatch');
    }
  }
  const { version, requestDigest: digest, resources, ...fields } = intent;
  const effective = inspectImages(fields, plan.images, digest);
  if (requestDigest(fields, effective.title, effective.contentHash) !== digest)
    fail('invalid-intent');
  if (bytes !== intent.resources.reduce((sum, r) => sum + r.before.bytes + r.after.bytes, 0))
    fail('payload-mismatch');
  return true;
}
function decodeIntent(buffer, resourcePolicy) {
  const p = policy(resourcePolicy);
  if (!Buffer.isBuffer(buffer) || buffer.length > p.maxStagedBytes) fail('stage-limit');
  return parse(completeSchema, json(buffer), 'invalid-intent');
}
function createPlan(rawFields, rawImages, resourcePolicy, availableBytes) {
  const p = policy(resourcePolicy);
  const fields = parse(fieldsSchema, rawFields, 'invalid-intent');
  bounded(rawImages, p.maxStagedBytes);
  const images = Object.fromEntries(
    kinds.map((kind) => [
      kind,
      Object.fromEntries(
        ['before', 'after'].map((side) => [
          side,
          rawImages[kind][side] === null ? null : Buffer.from(rawImages[kind][side])
        ])
      )
    ])
  );
  const effective = inspectImages(fields, images);
  const digest = requestDigest(fields, effective.title, effective.contentHash);
  stamp(fields, images, digest);
  const intent = freeze({
    ...fields,
    version: 1,
    requestDigest: digest,
    resources: kinds.map((kind) => ({
      kind,
      before: describe(images[kind].before),
      after: describe(images[kind].after)
    }))
  });
  const plan = { intent, images };
  validatePlan(plan, p);
  const stagedBytes = bounded(images, p.maxStagedBytes);
  const metadataBytes =
    Buffer.byteLength(JSON.stringify(intent)) +
    Buffer.byteLength(JSON.stringify(marker(plan, 'commit'))) +
    Buffer.byteLength(JSON.stringify(marker(plan, 'complete')));
  const scratchBytes = Math.max(...intent.resources.map((r) => r.after.bytes));
  const requiredBytes = stagedBytes + metadataBytes + scratchBytes;
  if (!Number.isSafeInteger(availableBytes) || availableBytes < 0) fail('policy-required');
  if (
    !Number.isSafeInteger(requiredBytes + p.minFreeBytes) ||
    availableBytes < requiredBytes + p.minFreeBytes
  )
    fail('space-limit');
  return Object.freeze({ ...plan, stagedBytes, metadataBytes, scratchBytes, requiredBytes });
}
module.exports = { createPlan, validatePlan, decodeIntent, marker, findCommitted };
