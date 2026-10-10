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
    await this.workspace(wid);
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
  async saveDocument(wid, docId, title, content, expectedHash, reason = '手动保存', revision) {
    title = nameSchema.parse(title);
    content = contentSchema.parse(content);
    return this.revisionWrite(
      { kind: 'save', workspaceId: wid, documentId: docId, title, content, expectedHash, reason },
      revision
    );
  },
  async restore(wid, docId, snapshotId, expectedHash, revision) {
    return this.revisionWrite(
      {
        kind: 'restore',
        workspaceId: wid,
        documentId: docId,
        snapshotId: idSchema.parse(snapshotId),
        expectedHash,
        reason: '恢复历史快照'
      },
      revision
    );
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
