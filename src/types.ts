export type Kind = 'chapter' | 'character' | 'world' | 'outline' | 'style';
export interface Document { id: string; title: string; kind: Kind; content: string; hash: string; }
export interface Proposal { id: string; docId: string; baseHash: string; action: string; text: string; createdAt: string; status: 'pending' | 'accepted' | 'discarded'; }
export interface Session { id: string; name: string; documentId: string; prompt: string; proposals: Proposal[]; }
export interface Workspace { id: string; name: string; path: string; stage: string; target: number; documents: Document[]; sessions: Session[]; activeSessionId: string; checks: string[]; }
export interface Settings { endpoint: string; model: string; hasKey: boolean; }
export interface Snapshot { id: string; title: string; content: string; createdAt: string; reason: string; }
export interface AppState { workspaces: Workspace[]; activeWorkspaceId: string; theme: string; }
export interface Bridge {
  load(): Promise<AppState>;
  createWorkspace(name: string): Promise<AppState>;
  openWorkspace(): Promise<AppState | null>;
  switchWorkspace(id: string): Promise<Workspace>;
  saveDocument(wid: string, id: string, title: string, content: string, hash: string, reason?: string): Promise<Document>;
  createDocument(wid: string, title: string, kind: Kind): Promise<Document>;
  updateWorkspace(wid: string, data: Partial<Pick<Workspace, 'stage' | 'checks' | 'target'>>): Promise<Workspace>;
  createSession(wid: string, name: string): Promise<Workspace>;
  updateSession(wid: string, sid: string, documentId: string, prompt: string): Promise<Workspace>;
  switchSession(wid: string, sid: string): Promise<Workspace>;
  getSettings(wid: string): Promise<Settings>;
  setSettings(wid: string, endpoint: string, model: string, key: string): Promise<Settings>;
  generate(wid: string, sid: string, docId: string, action: string, prompt: string, contextIds: string[], requestId: string): Promise<Proposal>;
  cancel(requestId: string): Promise<void>;
  resolveProposal(wid: string, sid: string, pid: string, accept: boolean): Promise<Workspace>;
  snapshots(wid: string, docId: string): Promise<Snapshot[]>;
  restore(wid: string, docId: string, snapshotId: string, hash: string): Promise<Document>;
  exportWorkspace(wid: string): Promise<string | null>;
  setTheme(theme: string): Promise<void>;
}
declare global { interface Window { composer?: Bridge; } }
