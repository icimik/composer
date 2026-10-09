const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { z } = require('zod');
const idSchema = z.string().regex(/^[a-z0-9-]{1,80}$/);
const nameSchema = z.string().trim().min(1).max(120);
const contentSchema = z.string().max(2_000_000);
const kindSchema = z.enum(['chapter', 'character', 'world', 'outline', 'style']);
const proposalSchema = z.object({
  id: idSchema, docId: idSchema, baseHash: z.string(), action: z.string(),
  text: contentSchema, createdAt: z.string(), status: z.enum(['pending','accepted','discarded'])
});
const sessionSchema = z.object({
  id: idSchema, name: nameSchema, documentId: idSchema, prompt: z.string().max(10000),
  proposals: z.array(proposalSchema).max(1000)
});
const workspaceSchema = z.object({
  version: z.literal(1), id: idSchema, name: nameSchema,
  stage: z.string().max(40), target: z.number().int().positive().max(10000000),
  documents: z.array(z.object({ id: idSchema, title: nameSchema, kind: kindSchema })).max(10000),
  sessions: z.array(sessionSchema).min(1).max(100), activeSessionId: idSchema,
  checks: z.array(z.string().max(100)).max(50)
});
const newId = () => crypto.randomUUID();
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
async function atomic(file, value) {
  await fs.mkdir(path.dirname(file), {recursive:true});
  const tmp = `${file}.${newId()}.tmp`;
  let handle;
  try {
    handle = await fs.open(tmp, 'wx', 0o600);
    await handle.writeFile(value, 'utf8');
    await handle.sync();
    await handle.close(); handle = null;
    await fs.rename(tmp, file);
  } finally {
    if (handle) await handle.close();
    await fs.rm(tmp, {force:true});
  }
}
const folders = {chapter:'07-writing/chapters',character:'03-foundation/souls',world:'03-foundation',outline:'04-outline',style:'05-rules'};
class Store {
  constructor(root) { this.root=root; this.registry=null; this.queue=Promise.resolve(); }
  serial(fn) { const task=this.queue.then(fn); this.queue=task.catch(()=>{}); return task; }
  async init() {
    await fs.mkdir(this.root,{recursive:true});
    try { this.registry=JSON.parse(await fs.readFile(path.join(this.root,'registry.json'),'utf8')); }
    catch(e) { if(e.code!=='ENOENT') throw new Error('工作区索引损坏，请保留原文件并从备份恢复。'); this.registry={workspaces:[],activeWorkspaceId:'',theme:'light'}; }
    if (!Array.isArray(this.registry.workspaces)) throw new Error('工作区索引格式错误。');
    if(!this.registry.workspaces.length) await this.createWorkspace('未命名小说');
  }
  async persistRegistry() { await atomic(path.join(this.root,'registry.json'),JSON.stringify(this.registry,null,2)); }
  entry(wid) { idSchema.parse(wid); const e=this.registry.workspaces.find(w=>w.id===wid); if(!e) throw new Error('找不到此工作区。'); return e; }
  manifestPath(wid) { return path.join(this.entry(wid).path,'.composer','workspace.json'); }
  async protectedFile(wid,relative) {
    const root=await fs.realpath(this.entry(wid).path);
    const file=path.join(root,relative);
    await fs.mkdir(path.dirname(file),{recursive:true});
    const dir=await fs.realpath(path.dirname(file));
    if(!dir.startsWith(root+path.sep))throw new Error('内部目录不可指向工作区以外。');
    try{if((await fs.lstat(file)).isSymbolicLink())throw new Error('不允许通过符号链接访问工作区内部文件。');}
    catch(e){if(e.code!=='ENOENT')throw e;}
    return file;
  }
  async meta(wid) { return workspaceSchema.parse(JSON.parse(await fs.readFile(await this.protectedFile(wid,'.composer/workspace.json'),'utf8'))); }
  async writeMeta(wid, data) { await atomic(await this.protectedFile(wid,'.composer/workspace.json'),JSON.stringify(workspaceSchema.parse(data),null,2)); }
  async docPath(wid, doc) {
    idSchema.parse(doc.id); kindSchema.parse(doc.kind);
    const root=await fs.realpath(this.entry(wid).path);
    const file=path.join(root, folders[doc.kind],`${doc.id}.md`);
    const dir=path.dirname(file);
    await fs.mkdir(dir,{recursive:true});
    const real=await fs.realpath(dir);
    if(!real.startsWith(root+path.sep)) throw new Error('文稿目录不可指向工作区以外。');
    try { const stat=await fs.lstat(file); if(stat.isSymbolicLink()) throw new Error('不允许通过符号链接读写文稿。'); }
    catch(e) { if(e.code!=='ENOENT') throw e; }
    return file;
  }
  async workspace(wid) {
    const meta=await this.meta(wid);
    const documents=await Promise.all(meta.documents.map(async d=>{
      const content=await fs.readFile(await this.docPath(wid,d),'utf8');
      return {...d,content,hash:hash(content)};
    }));
    return {...meta,path:this.entry(wid).path,documents};
  }
  async load() {
    return {...this.registry,workspaces:await Promise.all(this.registry.workspaces.map(w=>this.workspace(w.id)))};
  }
  async createWorkspace(name, base) {
    name=nameSchema.parse(name);
    const wid=newId(); const root=base || path.join(this.root,'workspaces',wid);
    await fs.mkdir(root,{recursive:true});
    try { await fs.access(path.join(root,'.composer','workspace.json')); throw new Error('此目录已是工作区，请使用打开。'); }
    catch(e) { if(e.code!=='ENOENT') throw e; }
    const doc={id:newId(),title:'第一章',kind:'chapter'};
    const sid=newId();
    const meta={version:1,id:wid,name,stage:'立项',target:80000,documents:[doc],
      sessions:[{id:sid,name:'创作会话',documentId:doc.id,prompt:'',proposals:[]}],activeSessionId:sid,checks:[]};
    this.registry.workspaces.push({id:wid,name,path:await fs.realpath(root)});
    this.registry.activeWorkspaceId=wid;
    for(const folder of [...Object.values(folders),'08-operations/logs','08-operations/change-log','11-quality','10-publication']) await fs.mkdir(path.join(root,folder),{recursive:true});
    await atomic(await this.docPath(wid,doc),'');
    await this.writeMeta(wid,meta); await this.persistRegistry();
    return this.load();
  }
  async openWorkspace(root) {
    root=await fs.realpath(root);
    const meta=workspaceSchema.parse(JSON.parse(await fs.readFile(path.join(root,'.composer','workspace.json'),'utf8')));
    const existing=this.registry.workspaces.find(w=>w.id===meta.id);
    if(existing && existing.path!==root) throw new Error('已有相同 ID 的工作区，请打开原目录，避免并行正文。');
    if(!existing) this.registry.workspaces.push({id:meta.id,name:meta.name,path:root});
    this.registry.activeWorkspaceId=meta.id; await this.persistRegistry(); return this.load();
  }
  async switchWorkspace(wid) { this.entry(wid); this.registry.activeWorkspaceId=wid; await this.persistRegistry(); return this.workspace(wid); }
  async updateWorkspace(wid, data) {
    data=z.object({stage:z.enum(['立项','设定','大纲','样章','写作','审阅','发布']).optional(),checks:z.array(z.string().max(100)).max(50).optional(),target:z.number().int().positive().max(10000000).optional()}).strict().parse(data);
    const meta=await this.meta(wid); Object.assign(meta,data); await this.writeMeta(wid,meta); return this.workspace(wid);
  }
  async createDocument(wid, title, kind) {
    title=nameSchema.parse(title); kind=kindSchema.parse(kind);
    const meta=await this.meta(wid); const doc={id:newId(),title,kind};
    await atomic(await this.docPath(wid,doc),''); meta.documents.push(doc); await this.writeMeta(wid,meta);
    return {...doc,content:'',hash:hash('')};
  }
  async history(wid, docId) {
    idSchema.parse(docId);
    try { return JSON.parse(await fs.readFile(await this.protectedFile(wid,`.composer/history/${docId}.json`),'utf8')); }
    catch(e) { if(e.code==='ENOENT') return []; throw e; }
  }
  async saveDocument(wid, docId, title, content, expectedHash, reason='手动保存') {
    title=nameSchema.parse(title); content=contentSchema.parse(content);
    const meta=await this.meta(wid); const doc=meta.documents.find(d=>d.id===idSchema.parse(docId));
    if(!doc) throw new Error('找不到此文档。');
    const file=await this.docPath(wid,doc); const before=await fs.readFile(file,'utf8');
    if(hash(before)!==expectedHash) throw new Error('文稿已被其他操作修改。请重新打开当前工作区后再保存，编辑区内容仍保留。');
    if(before!==content) {
      const snapshots=await this.history(wid,docId);
      snapshots.push({id:newId(),title:doc.title,content:before,createdAt:new Date().toISOString(),reason});
      await atomic(await this.protectedFile(wid,`.composer/history/${docId}.json`),JSON.stringify(snapshots,null,2));
      await atomic(file,content);
    }
    doc.title=title; await this.writeMeta(wid,meta);
    const log={time:new Date().toISOString(),documentId:docId,title,reason,beforeHash:hash(before),afterHash:hash(content)};
    await fs.appendFile(await this.protectedFile(wid,'08-operations/logs/changes.jsonl'),JSON.stringify(log)+'\n','utf8');
    return {...doc,content,hash:hash(content)};
  }
  async createSession(wid, name) {
    const meta=await this.meta(wid); const current=meta.sessions.find(s=>s.id===meta.activeSessionId);
    const s={id:newId(),name:nameSchema.parse(name),documentId:current.documentId,prompt:'',proposals:[]};
    meta.sessions.push(s); meta.activeSessionId=s.id; await this.writeMeta(wid,meta); return this.workspace(wid);
  }
  async switchSession(wid,sid) {
    const meta=await this.meta(wid); if(!meta.sessions.some(s=>s.id===idSchema.parse(sid))) throw new Error('找不到此会话。');
    meta.activeSessionId=sid; await this.writeMeta(wid,meta); return this.workspace(wid);
  }
  async updateSession(wid,sid,documentId,prompt) {
    const meta=await this.meta(wid); const s=meta.sessions.find(s=>s.id===idSchema.parse(sid));
    if(!s || !meta.documents.some(d=>d.id===idSchema.parse(documentId))) throw new Error('会话或文档不属于此工作区。');
    s.documentId=documentId; s.prompt=z.string().max(10000).parse(prompt); await this.writeMeta(wid,meta); return this.workspace(wid);
  }
  async addProposal(wid,sid,proposal) {
    const meta=await this.meta(wid); const s=meta.sessions.find(s=>s.id===sid); if(!s) throw new Error('会话不存在。');
    s.proposals.push(proposalSchema.parse(proposal)); await this.writeMeta(wid,meta); return proposal;
  }
  async resolveProposal(wid,sid,pid,accept) {
    const meta=await this.meta(wid); const s=meta.sessions.find(s=>s.id===idSchema.parse(sid));
    const p=s?.proposals.find(p=>p.id===idSchema.parse(pid));
    if(!p || p.status!=='pending') throw new Error('提案不存在或已处理。');
    if(accept) {
      const doc=meta.documents.find(d=>d.id===p.docId);
      const before=await fs.readFile(await this.docPath(wid,doc),'utf8');
      if(hash(before)!==p.baseHash) throw new Error('正文已变化，不能采纳旧提案。请基于新正文重新生成。');
      const content=p.action==='continue' ? before+(before?'\n\n':'')+p.text : p.text;
      await this.saveDocument(wid,doc.id,doc.title,content,p.baseHash,`采纳 AI ${p.action} 提案 ${pid}`);
    }
    const fresh=await this.meta(wid); fresh.sessions.find(s=>s.id===sid).proposals.find(p=>p.id===pid).status=accept?'accepted':'discarded';
    await this.writeMeta(wid,fresh); return this.workspace(wid);
  }
  async restore(wid,docId,snapshotId,expectedHash) {
    const list=await this.history(wid,docId); const snap=list.find(s=>s.id===idSchema.parse(snapshotId));
    if(!snap) throw new Error('快照不存在。');
    return this.saveDocument(wid,docId,snap.title,snap.content,expectedHash,'恢复历史快照');
  }
  async exportText(wid) {
    const w=await this.workspace(wid);
    return `# ${w.name}\n\n`+w.documents.filter(d=>d.kind==='chapter').map(d=>`## ${d.title}\n\n${d.content}`).join('\n\n---\n\n');
  }
}
module.exports={Store,atomic,hash,newId,idSchema};
