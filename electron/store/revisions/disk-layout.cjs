const fs = require('node:fs/promises');
const { idSchema, folders } = require('../primitives.cjs');
const { guardedFile } = require('../paths.cjs');
const { parse, policy, json, equal, kinds, fail } = require('./format.cjs');
const { decodeIntent, validatePlan } = require('./journal.cjs');
const io = require('./disk-io.cjs');

const metadataLimit = 64 * 1024;
function folder(operationId) {
  parse(idSchema, operationId, 'invalid-intent');
  return `.composer/transactions/${operationId}`;
}
function targets(intent) {
  return {
    manuscript: `${folders[intent.documentKind]}/${intent.documentId}.md`,
    manifest: '.composer/workspace.json',
    history: `.composer/history/${intent.documentId}.json`,
    audit: '08-operations/logs/changes.jsonl'
  };
}
async function current(root, intent, resourcePolicy) {
  const p = policy(resourcePolicy);
  const paths = targets(intent);
  const result = {};
  let remaining = p.maxStagedBytes;
  for (const kind of kinds) {
    result[kind] = await io.read(root, paths[kind], remaining, true);
    remaining -= result[kind]?.length || 0;
  }
  return result;
}
async function load(root, operationId, resourcePolicy) {
  const p = policy(resourcePolicy);
  const dir = folder(operationId);
  const bytes = await io.read(root, `${dir}/intent.json`, metadataLimit);
  const intent = decodeIntent(bytes, { ...p, maxStagedBytes: metadataLimit });
  if (intent.operationId !== operationId) fail('invalid-intent');
  const images = {};
  const allowed = ['intent.json', 'commit.json', 'complete.json'];
  let remaining = p.maxStagedBytes;
  for (const resource of intent.resources) {
    images[resource.kind] = {};
    for (const side of ['before', 'after']) {
      const descriptor = resource[side];
      const name = `${resource.kind}.${side}`;
      if (!descriptor.absent) allowed.push(name);
      const value = descriptor.absent
        ? null
        : await io.read(root, `${dir}/${name}`, Math.min(remaining, descriptor.bytes));
      images[resource.kind][side] = value;
      remaining -= value?.length || 0;
    }
  }
  const names = await fs.readdir(await guardedFile(root, dir));
  if (names.some((name) => !allowed.includes(name))) fail('invalid-intent');
  const plan = { intent, images };
  validatePlan(plan, p);
  const markers = {};
  for (const phase of ['commit', 'complete']) {
    const value = await io.read(root, `${dir}/${phase}.json`, metadataLimit, true);
    if (value !== null) markers[phase] = json(value);
  }
  return { plan, markers };
}
function allBefore(intent, observed) {
  const { describe } = require('./format.cjs');
  return intent.resources.every((r) => equal(describe(observed[r.kind]), r.before));
}
module.exports = { folder, targets, current, load, allBefore, metadataLimit };
