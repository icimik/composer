const fs = require('node:fs/promises');
const { guardedFile } = require('../paths.cjs');
const { idSchema } = require('../primitives.cjs');
const { WorkspaceFault } = require('../diagnostics.cjs');

async function entries(root) {
  const result = [];
  for (const parent of ['.composer/transactions', '.composer/transaction-cleanup']) {
    let items;
    try {
      items = await fs.readdir(await guardedFile(root, parent), { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    for (const item of items)
      result.push({ parent, name: item.name, directory: item.isDirectory() });
  }
  return result;
}
async function assertReady(root) {
  if ((await entries(root)).length) throw new WorkspaceFault('revision-recovery-required');
}
async function single(root) {
  const rows = await entries(root);
  if (rows.length !== 1 || !rows[0].directory || !idSchema.safeParse(rows[0].name).success)
    throw new WorkspaceFault('revision-recovery-required');
  await guardedFile(root, `${rows[0].parent}/${rows[0].name}`);
  return { operationId: rows[0].name, retired: rows[0].parent.endsWith('transaction-cleanup') };
}
module.exports = { entries, assertReady, single };
