const fs = require('node:fs/promises');
const { guardedFile } = require('../paths.cjs');
const { UserFacingError } = require('../../errors.cjs');
const { policy, fail } = require('./format.cjs');
const { inspect } = require('./recovery.cjs');
const layout = require('./disk-layout.cjs');
const retired = require('./retired.cjs');
const io = require('./disk-io.cjs');

async function admissible(root, operationId, resourcePolicy) {
  const names = await fs.readdir(await guardedFile(root, '.composer/transactions'));
  if (names.length !== 1 || names[0] !== operationId) fail('invalid-intent');
  const { plan, markers } = await layout.load(root, operationId, resourcePolicy);
  const state = await layout.current(root, plan.intent, resourcePolicy);
  const view = inspect(plan, state, markers, resourcePolicy);
  if (!['cleanup-prepared', 'cleanup-complete'].includes(view.action)) fail('baseline-conflict');
  return view;
}
async function drain(root, operationId, resourcePolicy, step) {
  const view = await retired.inspect(root, operationId, resourcePolicy);
  // A prior rename may be visible but its parent flush failed. Re-establish retirement before deleting evidence.
  await io.syncDirectory(root, '.composer/transactions');
  await io.syncDirectory(root, retired.parent);
  await step('cleanup:retirement-flushed');
  const payloads = view.names.filter((name) => !name.endsWith('.json'));
  // Keep intent until last; remove complete before commit so every intermediate marker set remains valid.
  const ordered = [...payloads, 'complete.json', 'commit.json', 'intent.json'].filter((name) =>
    view.names.includes(name)
  );
  for (const name of ordered) {
    await step(`before-clean:${name}`);
    await retired.remove(root, `${view.dir}/${name}`, view.expected[name]);
    await step(`cleaned:${name}`);
  }
  if ((await fs.readdir(await guardedFile(root, view.dir))).length) fail('invalid-intent');
  await step('cleanup:empty');
  await fs.rmdir(await guardedFile(root, view.dir));
  await io.syncDirectory(root, retired.parent);
  await step('cleanup:removed');
  return { status: 'cleaned', directorySyncSupported: process.platform !== 'win32' };
}
async function cleanup(root, operationId, resourcePolicy, step = async () => {}) {
  try {
    const p = policy(resourcePolicy);
    const active = layout.folder(operationId);
    const target = retired.folder(operationId);
    const hasActive = await retired.exists(root, active);
    const hasRetired = await retired.exists(root, target);
    if (hasActive && hasRetired) fail('invalid-intent');
    if (!hasActive && !hasRetired) return { status: 'absent' };
    if (hasRetired) {
      const names = await fs.readdir(await guardedFile(root, retired.parent));
      if (names.length !== 1 || names[0] !== operationId) fail('invalid-intent');
      const activeParent = '.composer/transactions';
      if (
        (await retired.exists(root, activeParent)) &&
        (await fs.readdir(await guardedFile(root, activeParent))).length
      )
        fail('invalid-intent');
      return await drain(root, operationId, p, step);
    }
    await admissible(root, operationId, p);
    const parent = await guardedFile(root, retired.parent, true);
    try {
      await fs.mkdir(parent);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    await io.syncDirectory(root, '.composer');
    await retired.assertEmpty(root);
    await step('cleanup:before-retire');
    // Revalidate after preparation/callback; no canonical files are modified by cleanup.
    await admissible(root, operationId, p);
    await fs.rename(await guardedFile(root, active), await guardedFile(root, target));
    await io.syncDirectory(root, '.composer/transactions');
    await io.syncDirectory(root, retired.parent);
    await step('cleanup:retired');
    return await drain(root, operationId, p, step);
  } catch (error) {
    if (error instanceof UserFacingError) throw error;
    fail('io-failure');
  }
}
module.exports = { cleanup };
