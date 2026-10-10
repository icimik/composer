const fs = require('node:fs/promises');
const path = require('node:path');
const { z } = require('zod');
const { readRegistry } = require('./registry.cjs');
const { readWorkspace } = require('./reader.cjs');
const { guardedFile } = require('./paths.cjs');
const { UserFacingError } = require('../errors.cjs');
const {
  atomic,
  hash,
  newId,
  idSchema,
  nameSchema,
  contentSchema,
  kindSchema,
  proposalSchema,
  workspaceSchema,
  folders
} = require('./primitives.cjs');
module.exports = {
  async init() {
    await fs.mkdir(this.root, { recursive: true });
    this.registry = (await readRegistry(this.root)) || {
      workspaces: [],
      activeWorkspaceId: '',
      theme: 'light'
    };
    if (!this.registry.workspaces.length) await this.createWorkspace('未命名小说');
  },
  async createWorkspace(name, base) {
    name = nameSchema.parse(name);
    const wid = newId();
    const root = base || path.join(this.root, 'workspaces', wid);
    if (this.registry.workspaces.some((w) => w.path === path.resolve(root)))
      throw new UserFacingError('已登记目录不能新建替代工作区，请使用打开或重试。');
    await fs.mkdir(root, { recursive: true });
    try {
      await fs.access(await guardedFile(await fs.realpath(root), '.composer/workspace.json'));
      throw new UserFacingError('此目录已是工作区，请使用打开。');
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    const doc = { id: newId(), title: '第一章', kind: 'chapter' };
    const sid = newId();
    const meta = {
      version: 1,
      id: wid,
      name,
      stage: '立项',
      target: 80000,
      documents: [doc],
      sessions: [{ id: sid, name: '创作会话', documentId: doc.id, prompt: '', proposals: [] }],
      activeSessionId: sid,
      checks: []
    };
    const entry = { id: wid, name, path: await fs.realpath(root) };
    if (this.registry.workspaces.some((w) => w.path === entry.path))
      throw new UserFacingError('已登记目录不能新建替代工作区，请使用打开或重试。');
    for (const folder of [
      ...Object.values(folders),
      '08-operations/logs',
      '08-operations/change-log',
      '11-quality',
      '10-publication'
    ])
      await guardedFile(entry.path, `${folder}/.directory-check`, true);
    await atomic(await guardedFile(entry.path, `${folders[doc.kind]}/${doc.id}.md`, true), '');
    await atomic(
      await guardedFile(entry.path, '.composer/workspace.json', true),
      JSON.stringify(meta, null, 2)
    );
    await readWorkspace(entry);
    const next = {
      ...this.registry,
      workspaces: [...this.registry.workspaces, entry],
      activeWorkspaceId: wid
    };
    await this.persistRegistry(next);
    this.registry = next;
    return this.load();
  },
  async openWorkspace(root) {
    root = await fs.realpath(root);
    const meta = await readWorkspace({ path: root });
    const existing = this.registry.workspaces.find((w) => w.id === meta.id);
    if (existing && existing.path !== root)
      throw new UserFacingError('已有相同 ID 的工作区，请打开原目录，避免并行正文。');
    const workspaces = existing
      ? this.registry.workspaces
      : [...this.registry.workspaces, { id: meta.id, name: meta.name, path: root }];
    const next = { ...this.registry, workspaces, activeWorkspaceId: meta.id };
    await this.persistRegistry(next);
    this.registry = next;
    return this.load();
  },
  async switchWorkspace(wid) {
    const result = await this.workspaceResult(wid);
    if (result.status === 'unavailable') return result;
    const next = { ...this.registry, activeWorkspaceId: wid };
    await this.persistRegistry(next);
    this.registry = next;
    return { status: 'selected', workspace: result.workspace };
  },
  async updateWorkspace(wid, data) {
    data = z
      .object({
        stage: z.enum(['立项', '设定', '大纲', '样章', '写作', '审阅', '发布']).optional(),
        checks: z.array(z.string().max(100)).max(50).optional(),
        target: z.number().int().positive().max(10000000).optional()
      })
      .strict()
      .parse(data);
    const meta = await this.writableMeta(wid);
    Object.assign(meta, data);
    await this.writeMeta(wid, meta);
    return this.workspace(wid);
  }
};
