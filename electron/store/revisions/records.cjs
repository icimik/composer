const { z } = require('zod');
const { idSchema, nameSchema, contentSchema } = require('../primitives.cjs');
const { sha, parse, text, json, equal, fail, hash } = require('./format.cjs');

const snapshot = z
  .object({
    id: idSchema,
    title: nameSchema,
    content: contentSchema,
    createdAt: z.string().datetime(),
    reason: z.string()
  })
  .strict();
const event = z
  .object({
    time: z.string().datetime(),
    documentId: idSchema,
    title: nameSchema,
    reason: z.string(),
    beforeHash: sha,
    afterHash: sha,
    operationId: idSchema.optional(),
    requestDigest: sha.optional()
  })
  .strict();
function history(buffer) {
  if (buffer === null) return [];
  const rows = parse(z.array(snapshot), json(buffer), 'invalid-images');
  if (new Set(rows.map((row) => row.id)).size !== rows.length) fail('invalid-images');
  return rows;
}
function audit(buffer, unsignedLast = false) {
  if (buffer === null || buffer.length === 0) return [];
  const lines = text(buffer).split('\n');
  if (lines.at(-1) === '') lines.pop();
  const seen = new Set();
  return lines.map((line, index) => {
    const row = parse(event, json(Buffer.from(line)), 'invalid-images');
    const unsigned = unsignedLast && index === lines.length - 1 && !!row.operationId;
    if (!!row.operationId !== !!row.requestDigest && !unsigned) fail('invalid-images');
    if (row.operationId && seen.has(row.operationId)) fail('invalid-images');
    if (row.operationId) seen.add(row.operationId);
    return row;
  });
}
function prefix(buffer) {
  const value = buffer === null ? '' : text(buffer);
  return value && !value.endsWith('\n') ? value + '\n' : value;
}
function stamp(fields, images, digest) {
  const before = audit(images.audit.before);
  const after = audit(images.audit.after, true);
  if (after.length !== before.length + 1 || !equal(after.slice(0, -1), before))
    fail('invalid-images');
  const row = after.at(-1);
  if (row.operationId !== fields.operationId || (row.requestDigest && row.requestDigest !== digest))
    fail('invalid-images');
  const raw = text(images.audit.after);
  if (!raw.startsWith(prefix(images.audit.before))) fail('invalid-images');
  images.audit.after = Buffer.from(
    prefix(images.audit.before) + JSON.stringify({ ...row, requestDigest: digest }) + '\n'
  );
}
function verifyRecords(fields, images, title, digest) {
  const before = history(images.history.before);
  const after = history(images.history.after);
  const changed = !images.manuscript.before.equals(images.manuscript.after);
  const expected = changed
    ? [
        ...before,
        {
          id: fields.operationId,
          title: fields.expectedTitle,
          content: text(images.manuscript.before),
          createdAt: fields.createdAt,
          reason: fields.reason
        }
      ]
    : before;
  if (!equal(after, expected)) fail('invalid-images');
  const oldAudit = audit(images.audit.before);
  const nextAudit = audit(images.audit.after);
  const expectedEvent = {
    time: fields.createdAt,
    documentId: fields.documentId,
    title,
    reason: fields.reason,
    beforeHash: fields.expectedHash,
    afterHash: hash(images.manuscript.after),
    operationId: fields.operationId,
    requestDigest: digest
  };
  if (!equal(nextAudit, [...oldAudit, expectedEvent])) fail('invalid-images');
  if (
    text(images.audit.after) !==
    prefix(images.audit.before) + JSON.stringify(expectedEvent) + '\n'
  )
    fail('invalid-images');
}
module.exports = { history, audit, stamp, verifyRecords };
