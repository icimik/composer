const fs = require('node:fs/promises');
const path = require('node:path');
const { z } = require('zod');
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
    try {
      this.registry = JSON.parse(await fs.readFile(path.join(this.root, 'registry.json'), 'utf8'));
    } catch (e) {
      if (e.code !== 'ENOENT') throw new Error('工作区索引损坏，请保留原文件并从备份恢复。');
      this.registry = { workspaces: [], activeWorkspaceId: '', theme: 'light' };
    }
    if (!Array.isArray(this.registry.workspaces)) throw new Error('工作区索引格式错误。');
    if (!this.registry.workspaces.length) await this.createWorkspace('未命名小说');
  },
  async createWorkspace(name, base) {
    name = nameSchema.parse(name);
    const wid = newId();
    const root = base || path.join(this.root, 'workspaces', wid);
    await fs.mkdir(root, { recursive: true });
    try {
      await fs.access(path.join(root, '.composer', 'workspace.json'));
      throw new Error('此目录已是工作区，请使用打开。');
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
    this.registry.workspaces.push({ id: wid, name, path: await fs.realpath(root) });
    this.registry.activeWorkspaceId = wid;
    for (const folder of [
      ...Object.values(folders),
      '08-operations/logs',
      '08-operations/change-log',
      '11-quality',
      '10-publication'
    ])
      await fs.mkdir(path.join(root, folder), { recursive: true });
    await atomic(await this.docPath(wid, doc), '');
    await this.writeMeta(wid, meta);
    await this.persistRegistry();
    return this.load();
  },
  async openWorkspace(root) {
    root = await fs.realpath(root);
    const meta = workspaceSchema.parse(
      JSON.parse(await fs.readFile(path.join(root, '.composer', 'workspace.json'), 'utf8'))
    );
    const existing = this.registry.workspaces.find((w) => w.id === meta.id);
    if (existing && existing.path !== root)
      throw new Error('已有相同 ID 的工作区，请打开原目录，避免并行正文。');
    if (!existing) this.registry.workspaces.push({ id: meta.id, name: meta.name, path: root });
    this.registry.activeWorkspaceId = meta.id;
    await this.persistRegistry();
    return this.load();
  },
  async switchWorkspace(wid) {
    this.entry(wid);
    this.registry.activeWorkspaceId = wid;
    await this.persistRegistry();
    return this.workspace(wid);
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
    const meta = await this.meta(wid);
    Object.assign(meta, data);
    await this.writeMeta(wid, meta);
    return this.workspace(wid);
  }
};
