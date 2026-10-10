const fs = require('node:fs/promises');
const { idSchema } = require('../primitives.cjs');
const { guardedFile } = require('../paths.cjs');
const { parse, policy, fail, describe, equal, json } = require('./format.cjs');
const { decodeIntent } = require('./journal.cjs');
const { validateMarkers } = require('./recovery.cjs');
const { metadataLimit } = require('./disk-layout.cjs');
const io = require('./disk-io.cjs');

const parent = '.composer/transaction-cleanup';
function folder(operationId) {
  parse(idSchema, operationId, 'invalid-intent');
  return `${parent}/${operationId}`;
}
async function exists(root, relative) {
  try {
    const stat = await fs.lstat(await guardedFile(root, relative));
    if (!stat.isDirectory()) fail('invalid-intent');
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}
async function assertEmpty(root) {
  if (await exists(root, parent)) {
    if ((await fs.readdir(await guardedFile(root, parent))).length) fail('invalid-intent');
  }
}
async function inspect(root, operationId, resourcePolicy) {
  const p = policy(resourcePolicy);
  const dir = folder(operationId);
  const names = await fs.readdir(await guardedFile(root, dir));
  // An empty retired directory cannot contain canonical or author files. No journal phase is inferred.
  if (!names.length) return { dir, names, expected: {} };
  const bytes = await io.read(root, `${dir}/intent.json`, metadataLimit);
  const intent = decodeIntent(bytes, { ...p, maxStagedBytes: metadataLimit });
  if (intent.operationId !== operationId) fail('invalid-intent');
  const size = intent.resources.reduce((n, r) => n + r.before.bytes + r.after.bytes, 0);
  if (!Number.isSafeInteger(size) || size > p.maxStagedBytes) fail('stage-limit');
  const expected = { 'intent.json': describe(bytes) };
  for (const r of intent.resources) {
    for (const side of ['before', 'after']) {
      if (!r[side].absent) expected[`${r.kind}.${side}`] = r[side];
    }
  }
  const markers = {};
  for (const phase of ['commit', 'complete']) {
    const name = `${phase}.json`;
    if (names.includes(name)) {
      const value = await io.read(root, `${dir}/${name}`, metadataLimit);
      markers[phase] = json(value);
      expected[name] = describe(value);
    }
  }
  validateMarkers(intent, markers);
  if (names.some((name) => !Object.hasOwn(expected, name))) fail('invalid-intent');
  // Validate the entire remaining inventory before deleting any file.
  for (const name of names) {
    const file = await guardedFile(root, `${dir}/${name}`);
    const stat = await fs.lstat(file);
    if (!stat.isFile() || stat.nlink !== 1) fail('invalid-images');
    const value = await io.read(root, `${dir}/${name}`, expected[name].bytes);
    if (!equal(describe(value), expected[name])) fail('payload-mismatch');
  }
  return { dir, names, expected };
}
async function remove(root, relative, expected) {
  const file = await guardedFile(root, relative);
  const owned = await fs.lstat(file);
  if (!owned.isFile() || owned.nlink !== 1) fail('invalid-images');
  const bytes = await io.read(root, relative, expected.bytes);
  if (!equal(describe(bytes), expected)) fail('payload-mismatch');
  const fresh = await fs.lstat(await guardedFile(root, relative));
  if (
    !fresh.isFile() ||
    fresh.nlink !== 1 ||
    fresh.dev !== owned.dev ||
    fresh.ino !== owned.ino ||
    fresh.birthtimeMs !== owned.birthtimeMs
  )
    fail('payload-mismatch');
  await fs.unlink(file);
  await io.syncDirectory(root, require('node:path').dirname(relative));
}
module.exports = { parent, folder, exists, assertEmpty, inspect, remove };
