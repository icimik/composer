const fs = require('node:fs/promises');
const path = require('node:path');
const { z } = require('zod');
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
  async createDocument(wid, title, kind) {
    title = nameSchema.parse(title);
    kind = kindSchema.parse(kind);
    const meta = await this.writableMeta(wid);
    const doc = { id: newId(), title, kind };
    await atomic(await this.docPath(wid, doc, true), '');
    meta.documents.push(doc);
    await this.writeMeta(wid, meta);
    return { ...doc, content: '', hash: hash('') };
  },
  async history(wid, docId) {
    idSchema.parse(docId);
    try {
      return JSON.parse(
        await fs.readFile(await this.protectedFile(wid, `.composer/history/${docId}.json`), 'utf8')
      );
    } catch (e) {
      if (e.code === 'ENOENT') return [];
      throw e;
    }
  },
  async saveDocument(wid, docId, title, content, expectedHash, reason = '手动保存') {
    title = nameSchema.parse(title);
    content = contentSchema.parse(content);
    const meta = await this.writableMeta(wid);
    const doc = meta.documents.find((d) => d.id === idSchema.parse(docId));
    if (!doc) throw new UserFacingError('找不到此文档。');
    const file = await this.docPath(wid, doc);
    const before = await fs.readFile(file, 'utf8');
    if (hash(before) !== expectedHash)
      throw new UserFacingError(
        '文稿已被其他操作修改。请重新打开当前工作区后再保存，编辑区内容仍保留。'
      );
    if (before !== content) {
      const snapshots = await this.history(wid, docId);
      snapshots.push({
        id: newId(),
        title: doc.title,
        content: before,
        createdAt: new Date().toISOString(),
        reason
      });
      await atomic(
        await this.protectedFile(wid, `.composer/history/${docId}.json`, true),
        JSON.stringify(snapshots, null, 2)
      );
      await atomic(file, content);
    }
    doc.title = title;
    await this.writeMeta(wid, meta);
    const log = {
      time: new Date().toISOString(),
      documentId: docId,
      title,
      reason,
      beforeHash: hash(before),
      afterHash: hash(content)
    };
    await fs.appendFile(
      await this.protectedFile(wid, '08-operations/logs/changes.jsonl', true),
      JSON.stringify(log) + '\n',
      'utf8'
    );
    return { ...doc, content, hash: hash(content) };
  },
  async restore(wid, docId, snapshotId, expectedHash) {
    await this.writableMeta(wid);
    const list = await this.history(wid, docId);
    const snap = list.find((s) => s.id === idSchema.parse(snapshotId));
    if (!snap) throw new UserFacingError('快照不存在。');
    return this.saveDocument(wid, docId, snap.title, snap.content, expectedHash, '恢复历史快照');
  },
  async exportText(wid) {
    const w = await this.workspace(wid);
    return (
      `# ${w.name}\n\n` +
      w.documents
        .filter((d) => d.kind === 'chapter')
        .map((d) => `## ${d.title}\n\n${d.content}`)
        .join('\n\n---\n\n')
    );
  }
};
