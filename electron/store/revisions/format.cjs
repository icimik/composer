const { z } = require('zod');
const { hash, idSchema, kindSchema, nameSchema } = require('../primitives.cjs');
const { UserFacingError } = require('../../errors.cjs');

const kinds = ['manuscript', 'manifest', 'history', 'audit'];
const sha = z.string().regex(/^[a-f0-9]{64}$/);
const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const policySchema = z
  .object({
    maxStagedBytes: integer.positive(),
    minFreeBytes: integer
  })
  .strict();
const plainFields = z
  .object({
    operationId: idSchema,
    workspaceId: idSchema,
    documentId: idSchema,
    documentKind: kindSchema,
    kind: z.enum(['save', 'restore', 'accept']),
    expectedHash: sha,
    expectedTitle: nameSchema,
    reason: z.string().max(1000),
    createdAt: z.string().datetime(),
    sessionId: idSchema.nullable(),
    proposalId: idSchema.nullable(),
    snapshotId: idSchema.nullable()
  })
  .strict();
const fieldsSchema = plainFields.refine((f) =>
  f.kind === 'accept'
    ? !!f.sessionId && !!f.proposalId && f.snapshotId === null
    : f.sessionId === null &&
      f.proposalId === null &&
      (f.kind === 'restore' ? !!f.snapshotId : f.snapshotId === null)
);
const descriptor = z
  .object({ bytes: integer, hash: sha.nullable(), absent: z.boolean() })
  .strict()
  .refine((v) => (v.absent ? v.bytes === 0 && v.hash === null : v.hash !== null));
const resource = z
  .object({
    kind: z.enum(kinds),
    before: descriptor,
    after: descriptor
  })
  .strict()
  .refine((v) => !v.after.absent || v.before.absent);
const completeSchema = plainFields
  .extend({
    version: z.literal(1),
    requestDigest: sha,
    resources: z.array(resource).length(4)
  })
  .strict()
  .refine((v) => {
    const { version, requestDigest, resources, ...fields } = v;
    return (
      fieldsSchema.safeParse(fields).success &&
      resources.every((r, index) => r.kind === kinds[index])
    );
  });
function fail(code) {
  const messages = {
    'policy-required': '修订资源策略尚未明确，未执行任何写入。',
    'stage-limit': '修订暂存大小超出限制，编辑区内容仍保留。',
    'space-limit': '可用空间不足，修订尚未完成，请保留现场。',
    'baseline-conflict': '正文或标题已变化，不能执行当前修订。',
    'operation-conflict': '修订标识已用于其他请求，未执行任何写入。',
    'invalid-images': '修订镜像无法验证，请保留现场。',
    'invalid-intent': '修订记录格式无法验证，请保留现场。',
    'payload-mismatch': '修订镜像与记录不一致，请保留现场。',
    'invalid-marker': '修订阶段标记无法验证，请保留现场。',
    'io-failure': '修订文件操作未完成，请保留现场并重试明确的恢复操作。'
  };
  const error = new UserFacingError(messages[code] || messages['invalid-images']);
  error.code = code;
  throw error;
}
function parse(schema, value, code) {
  const result = schema.safeParse(value);
  if (!result.success) fail(code);
  return result.data;
}
function policy(value) {
  return parse(policySchema, value, 'policy-required');
}
function text(buffer) {
  try {
    if (!Buffer.isBuffer(buffer)) fail('invalid-images');
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buffer);
  } catch {
    fail('invalid-images');
  }
}
function json(buffer) {
  try {
    return JSON.parse(text(buffer));
  } catch {
    fail('invalid-images');
  }
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])])
    );
  return value;
}
function equal(a, b) {
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
}
function describe(buffer) {
  if (buffer === null) return { bytes: 0, hash: null, absent: true };
  if (!Buffer.isBuffer(buffer)) fail('invalid-images');
  return { bytes: buffer.length, hash: hash(buffer), absent: false };
}
function bounded(images, limit) {
  if (!images || !equal(Object.keys(images).sort(), [...kinds].sort())) fail('invalid-images');
  let bytes = 0;
  for (const kind of kinds) {
    const image = images[kind];
    if (!image || !equal(Object.keys(image).sort(), ['after', 'before'])) fail('invalid-images');
    for (const side of ['before', 'after']) bytes += describe(image[side]).bytes;
  }
  if (!Number.isSafeInteger(bytes) || bytes > limit) fail('stage-limit');
  return bytes;
}
function requestDigest(fields, title, contentHash) {
  const { createdAt, ...request } = fields;
  return hash(JSON.stringify(stable({ ...request, title, contentHash })));
}
function freeze(value) {
  for (const item of Object.values(value)) if (item && typeof item === 'object') freeze(item);
  return Object.freeze(value);
}
module.exports = {
  kinds,
  sha,
  fieldsSchema,
  completeSchema,
  fail,
  parse,
  policy,
  text,
  json,
  equal,
  describe,
  bounded,
  requestDigest,
  freeze,
  hash
};
