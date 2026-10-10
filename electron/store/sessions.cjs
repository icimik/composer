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
  async createSession(wid, name) {
    const meta = await this.writableMeta(wid);
    const current = meta.sessions.find((s) => s.id === meta.activeSessionId);
    const s = {
      id: newId(),
      name: nameSchema.parse(name),
      documentId: current.documentId,
      prompt: '',
      proposals: []
    };
    meta.sessions.push(s);
    meta.activeSessionId = s.id;
    await this.writeMeta(wid, meta);
    return this.workspace(wid);
  },
  async switchSession(wid, sid) {
    const meta = await this.writableMeta(wid);
    if (!meta.sessions.some((s) => s.id === idSchema.parse(sid)))
      throw new UserFacingError('找不到此会话。');
    meta.activeSessionId = sid;
    await this.writeMeta(wid, meta);
    return this.workspace(wid);
  },
  async updateSession(wid, sid, documentId, prompt) {
    const meta = await this.writableMeta(wid);
    const s = meta.sessions.find((s) => s.id === idSchema.parse(sid));
    if (!s || !meta.documents.some((d) => d.id === idSchema.parse(documentId)))
      throw new UserFacingError('会话或文档不属于此工作区。');
    s.documentId = documentId;
    s.prompt = z.string().max(10000).parse(prompt);
    await this.writeMeta(wid, meta);
    return this.workspace(wid);
  },
  async addProposal(wid, sid, proposal) {
    const meta = await this.writableMeta(wid);
    const s = meta.sessions.find((s) => s.id === sid);
    if (!s) throw new UserFacingError('会话不存在。');
    s.proposals.push(proposalSchema.parse(proposal));
    await this.writeMeta(wid, meta);
    return proposal;
  },
  async resolveProposal(wid, sid, pid, accept, revision) {
    const meta = await this.writableMeta(wid);
    const s = meta.sessions.find((s) => s.id === idSchema.parse(sid));
    const p = s?.proposals.find((p) => p.id === idSchema.parse(pid));
    if (!p || (!accept && p.status !== 'pending'))
      throw new UserFacingError('提案不存在或已处理。');
    if (accept) {
      const doc = meta.documents.find((d) => d.id === p.docId);
      await this.revisionWrite(
        {
          kind: 'accept',
          workspaceId: wid,
          documentId: doc.id,
          sessionId: sid,
          proposalId: pid,
          expectedHash: p.baseHash,
          reason: `采纳 AI ${p.action} 提案 ${pid}`
        },
        revision
      );
      return this.workspace(wid);
    }
    const fresh = await this.meta(wid);
    fresh.sessions.find((s) => s.id === sid).proposals.find((p) => p.id === pid).status = accept
      ? 'accepted'
      : 'discarded';
    await this.writeMeta(wid, fresh);
    return this.workspace(wid);
  }
};
