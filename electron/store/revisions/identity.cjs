const { z } = require('zod');
const { idSchema, nameSchema } = require('../primitives.cjs');
const { sha, parse, policy, fail, freeze } = require('./format.cjs');
const { audit } = require('./records.cjs');

const currentSchema = z.object({ title: nameSchema, hash: sha }).strict();
function findCommitted(buffer, operationId, digest, current, resourcePolicy) {
  const p = policy(resourcePolicy);
  parse(idSchema, operationId, 'invalid-intent');
  parse(sha, digest, 'invalid-intent');
  const state = parse(currentSchema, current, 'invalid-images');
  if (buffer !== null && !Buffer.isBuffer(buffer)) fail('invalid-images');
  if (buffer !== null && buffer.length > p.maxStagedBytes) fail('stage-limit');
  const row = audit(buffer).find((event) => event.operationId === operationId);
  if (!row) return null;
  if (row.requestDigest !== digest) fail('operation-conflict');
  return freeze({
    operationId,
    status: 'already-committed',
    stale: row.afterHash !== state.hash || row.title !== state.title
  });
}
module.exports = { findCommitted };
