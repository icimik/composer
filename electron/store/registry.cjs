const fs = require('node:fs/promises');
const path = require('node:path');
const { z } = require('zod');
const { atomic, idSchema, nameSchema } = require('./primitives.cjs');
const { UserFacingError } = require('../errors.cjs');
const schema = z
  .object({
    workspaces: z
      .array(
        z
          .object({
            id: idSchema,
            name: nameSchema,
            path: z.string().refine(path.isAbsolute)
          })
          .strict()
      )
      .max(10000),
    activeWorkspaceId: z.union([idSchema, z.literal('')]),
    theme: z.enum(['light', 'dark'])
  })
  .strict();
async function readRegistry(root) {
  const file = path.join(root, 'registry.json');
  try {
    await fs.lstat(file);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw new UserFacingError('工作区索引损坏或不可读取，请保留原文件并从备份恢复。');
  }
  try {
    if ((await fs.lstat(file)).isSymbolicLink()) throw new Error('unsafe index');
    const registry = schema.parse(JSON.parse(await fs.readFile(file, 'utf8')));
    if (
      new Set(registry.workspaces.map((w) => w.id)).size !== registry.workspaces.length ||
      new Set(registry.workspaces.map((w) => w.path)).size !== registry.workspaces.length
    )
      throw new Error('duplicate index');
    return registry;
  } catch (error) {
    throw new UserFacingError('工作区索引损坏或不可读取，请保留原文件并从备份恢复。');
  }
}
async function persist(root, registry) {
  const file = path.join(root, 'registry.json');
  try {
    if ((await fs.lstat(file)).isSymbolicLink()) throw new Error('unsafe index');
  } catch (error) {
    if (error.code !== 'ENOENT')
      throw new UserFacingError('无法安全保存工作区索引，当前选择未改变。');
  }
  try {
    await atomic(file, JSON.stringify(registry, null, 2));
  } catch {
    throw new UserFacingError('无法保存工作区索引，当前选择未改变。');
  }
}
module.exports = { readRegistry, persist };
