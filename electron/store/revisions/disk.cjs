const fs = require('node:fs/promises');
const path = require('node:path');
const { guardedFile } = require('../paths.cjs');
const { UserFacingError } = require('../../errors.cjs');
const { policy, fail, describe, equal, json } = require('./format.cjs');
const { validatePlan, marker } = require('./journal.cjs');
const { inspect } = require('./recovery.cjs');
const io = require('./disk-io.cjs');
const layout = require('./disk-layout.cjs');

const nothing = async () => {};
async function preview(root, operationId, resourcePolicy) {
  const { plan, markers } = await layout.load(root, operationId, resourcePolicy);
  const observed = await layout.current(root, plan.intent, resourcePolicy);
  return inspect(plan, observed, markers, resourcePolicy);
}
async function prepare(root, plan, resourcePolicy, step) {
  const p = policy(resourcePolicy);
  validatePlan(plan, p);
  const metadata = Buffer.from(JSON.stringify(plan.intent));
  if (metadata.length > layout.metadataLimit) fail('stage-limit');
  const required =
    plan.intent.resources.reduce((n, r) => n + r.before.bytes + r.after.bytes, 0) +
    metadata.length +
    2 * layout.metadataLimit +
    Math.max(...plan.intent.resources.map((r) => r.after.bytes)) +
    p.minFreeBytes;
  if ((await io.available(root)) < required) fail('space-limit');
  if (!layout.allBefore(plan.intent, await layout.current(root, plan.intent, p)))
    fail('baseline-conflict');
  const dir = layout.folder(plan.intent.operationId);
  const parent = await guardedFile(root, '.composer/transactions', true);
  try {
    await fs.mkdir(parent);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  if ((await fs.readdir(await guardedFile(root, '.composer/transactions'))).length)
    fail('invalid-intent');
  await io.syncDirectory(root, '.composer');
  await fs.mkdir(await guardedFile(root, dir));
  for (const resource of plan.intent.resources) {
    for (const side of ['before', 'after']) {
      const value = plan.images[resource.kind][side];
      if (value !== null) await io.exclusive(root, `${dir}/${resource.kind}.${side}`, value);
      await step(`staged:${resource.kind}:${side}`);
    }
  }
  await io.exclusive(root, `${dir}/intent.json`, metadata);
  await io.syncDirectory(root, '.composer/transactions');
  await step('prepared');
  return dir;
}
async function install(root, plan, resourcePolicy, step) {
  const dir = layout.folder(plan.intent.operationId);
  const paths = layout.targets(plan.intent);
  for (const resource of plan.intent.resources) {
    const file = paths[resource.kind];
    const value = await io.read(root, file, policy(resourcePolicy).maxStagedBytes, true);
    if (equal(describe(value), resource.after)) continue;
    if (!equal(describe(value), resource.before)) fail('baseline-conflict');
    const scratch = `${file}.${plan.intent.operationId}.revision.tmp`;
    const bytes = await io.read(root, `${dir}/${resource.kind}.after`, resource.after.bytes);
    if (!equal(describe(bytes), resource.after)) fail('payload-mismatch');
    if ((await io.available(root)) < bytes.length + policy(resourcePolicy).minFreeBytes)
      fail('space-limit');
    try {
      await io.exclusive(root, scratch, bytes);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const existing = await io.read(root, scratch, bytes.length);
      if (!existing.equals(bytes)) fail('payload-mismatch');
      await io.flushFile(root, scratch);
    }
    await step(`scratch:${resource.kind}`);
    const fresh = await io.read(root, file, policy(resourcePolicy).maxStagedBytes, true);
    if (!equal(describe(fresh), resource.before)) fail('baseline-conflict');
    await fs.rename(await guardedFile(root, scratch), await guardedFile(root, file, true));
    await io.syncDirectory(root, path.dirname(file));
    await step(`installed:${resource.kind}`);
  }
  await layout.load(root, plan.intent.operationId, resourcePolicy);
  const observed = await layout.current(root, plan.intent, resourcePolicy);
  const committed = { commit: marker(plan, 'commit') };
  const view = inspect(plan, observed, committed, resourcePolicy);
  if (view.action !== 'roll-forward' || view.install.length) fail('payload-mismatch');
  const complete = await io.read(root, `${dir}/complete.json`, layout.metadataLimit, true);
  if (complete !== null) {
    committed.complete = json(complete);
    if (inspect(plan, observed, committed, resourcePolicy).action !== 'cleanup-complete')
      fail('invalid-marker');
  } else {
    await step('before:complete');
    await io.exclusive(
      root,
      `${dir}/complete.json`,
      Buffer.from(JSON.stringify(marker(plan, 'complete')))
    );
  }
  await step('complete');
  const final = await layout.load(root, plan.intent.operationId, resourcePolicy);
  const state = await layout.current(root, plan.intent, resourcePolicy);
  if (inspect(final.plan, state, final.markers, resourcePolicy).action !== 'cleanup-complete')
    fail('payload-mismatch');
  return { status: 'complete-retained', directorySyncSupported: process.platform !== 'win32' };
}
async function execute(root, plan, resourcePolicy, step = nothing) {
  const dir = await prepare(root, plan, resourcePolicy, step);
  const loaded = await layout.load(root, plan.intent.operationId, resourcePolicy);
  if (
    !layout.allBefore(
      loaded.plan.intent,
      await layout.current(root, loaded.plan.intent, resourcePolicy)
    )
  )
    fail('baseline-conflict');
  const scratch = Math.max(...loaded.plan.intent.resources.map((r) => r.after.bytes));
  if ((await io.available(root)) < scratch + policy(resourcePolicy).minFreeBytes)
    fail('space-limit');
  await step('before:commit');
  await io.exclusive(
    root,
    `${dir}/commit.json`,
    Buffer.from(JSON.stringify(marker(loaded.plan, 'commit')))
  );
  await step('commit');
  return install(root, loaded.plan, resourcePolicy, step);
}
async function recover(root, operationId, resourcePolicy, step = nothing) {
  const { plan, markers } = await layout.load(root, operationId, resourcePolicy);
  const observed = await layout.current(root, plan.intent, resourcePolicy);
  const view = inspect(plan, observed, markers, resourcePolicy);
  if (!['roll-forward', 'cleanup-complete'].includes(view.action)) fail('baseline-conflict');
  return install(root, plan, resourcePolicy, step);
}
function safe(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof UserFacingError) throw error;
      fail('io-failure');
    }
  };
}
module.exports = { execute: safe(execute), preview: safe(preview), recover: safe(recover) };
