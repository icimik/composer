import type { Bridge, AppState, Workspace, Document, Kind } from './types';
import { readyResult, readyWorkspace } from './composer/workspaceState';
const uid = () => crypto.randomUUID();
const digest = (s: string) => s; // Preview-only revision marker; never used by the desktop store.
const makeWorkspace = (name: string): Workspace => {
  const d: Document = {
    id: uid(),
    title: '第一章 · 迟来的信',
    kind: 'chapter',
    content:
      '雨停在凌晨四点。\n\n林遥推开邮局的门，鞋底带进一串水印。柜台后的老人没抬头，只把一封信推到灯下。\n\n“你的。”\n\n信封上的名字是她的。邮戳却是二十年前。\n\n她没有伸手。窗外，第一班渡船响了笛。',
    hash: ''
  };
  d.hash = digest(d.content);
  const sid = uid();
  return {
    id: uid(),
    name,
    path: '浏览器临时示例，不保存到磁盘',
    stage: '样章',
    target: 80000,
    documents: [d],
    sessions: [{ id: sid, name: '样章创作', documentId: d.id, prompt: '', proposals: [] }],
    activeSessionId: sid,
    checks: []
  };
};
export function previewBridge(): Bridge {
  const w = makeWorkspace('雾港来信');
  const state: AppState = {
    workspaces: [readyResult(w)],
    activeWorkspaceId: w.id,
    requestedActiveWorkspaceId: w.id,
    theme: 'light'
  };
  const workspace = (id: string) => readyWorkspace(state, id)!;
  const clone = <T>(v: T): T => structuredClone(v);
  return {
    load: async () => clone(state),
    createWorkspace: async (name) => {
      const w = makeWorkspace(name);
      const initial = w.documents[0];
      if (!initial) throw Error('预览工作区缺少初始章节。');
      initial.content = '';
      initial.hash = '';
      state.workspaces.push(readyResult(w));
      state.activeWorkspaceId = w.id;
      state.requestedActiveWorkspaceId = w.id;
      return clone(state);
    },
    openWorkspace: async () => {
      throw Error('打开本地目录需要桌面 App。');
    },
    switchWorkspace: async (id) => {
      state.activeWorkspaceId = id;
      state.requestedActiveWorkspaceId = id;
      return { status: 'selected', workspace: clone(workspace(id)) };
    },
    saveDocument: async (wid, id, title, content, hash) => {
      const d = workspace(wid).documents.find((d) => d.id === id)!;
      if (d.hash !== hash) throw Error('正文已变化。');
      Object.assign(d, { title, content, hash: digest(content) });
      return clone(d);
    },
    createDocument: async (wid, title, kind: Kind) => {
      const d = { id: uid(), title, kind, content: '', hash: '' };
      workspace(wid).documents.push(d);
      return clone(d);
    },
    updateWorkspace: async (wid, data) => {
      Object.assign(workspace(wid), data);
      return clone(workspace(wid));
    },
    createSession: async (wid, name) => {
      const w = workspace(wid);
      const s = {
        id: uid(),
        name,
        documentId: w.sessions.find((s) => s.id === w.activeSessionId)!.documentId,
        prompt: '',
        proposals: []
      };
      w.sessions.push(s);
      w.activeSessionId = s.id;
      return clone(w);
    },
    updateSession: async (wid, sid, documentId, prompt) => {
      Object.assign(
        workspace(wid).sessions.find((s) => s.id === sid)!,
        { documentId, prompt }
      );
      return clone(workspace(wid));
    },
    switchSession: async (wid, sid) => {
      workspace(wid).activeSessionId = sid;
      return clone(workspace(wid));
    },
    getSettings: async () => ({ endpoint: 'https://api.openai.com/v1', model: '', hasKey: false }),
    setSettings: async () => {
      throw Error('预览不接收密钥。请在桌面 App 中配置模型。');
    },
    generate: async () => {
      throw Error('浏览器预览不调用 AI，请使用桌面 App。');
    },
    cancel: async () => {},
    resolveProposal: async () => {
      throw Error('此操作需要桌面 App。');
    },
    snapshots: async () => [],
    restore: async () => {
      throw Error('历史快照需要桌面 App。');
    },
    revisionPreview: async () => {
      throw Error('修订记录检查需要桌面 App。');
    },
    applyRevision: async () => {
      throw Error('修订处理需要桌面 App。');
    },
    exportWorkspace: async () => {
      throw Error('请在桌面 App 中导出 Markdown。');
    },
    setTheme: async (theme) => {
      state.theme = theme;
    }
  };
}
