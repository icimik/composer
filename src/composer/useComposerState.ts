import { useState, useEffect, useRef, useCallback } from 'react';
import type { AppState, Workspace, Kind, Settings, Snapshot } from '../types';
import { bridge, cleanError } from './shared';
import { readyWorkspace, replaceWorkspace, refreshResults } from './workspaceState';
export function useComposerState() {
  const [state, setState] = useState<AppState | null>(null);
  const [draft, setDraft] = useState(''),
    [title, setTitle] = useState(''),
    [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('已保存'),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [view, setView] = useState<'write' | 'outline' | 'review'>('write');
  const [focus, setFocus] = useState(false),
    [panel, setPanel] = useState(true);
  const [dialog, setDialog] = useState<
    '' | 'workspace' | 'document' | 'session' | 'settings' | 'history' | 'commands' | 'help'
  >('');
  const [name, setName] = useState(''),
    [newKind, setNewKind] = useState<Kind>('chapter');
  const [settings, setSettings] = useState<Settings>({
      endpoint: 'https://api.openai.com/v1',
      model: '',
      hasKey: false
    }),
    [key, setKey] = useState('');
  const [contextIds, setContextIds] = useState<string[]>([]),
    [showContext, setShowContext] = useState(false);
  const [busy, setBusy] = useState(false),
    [action, setAction] = useState('generate'),
    [history, setHistory] = useState<Snapshot[]>([]);
  const [query, setQuery] = useState(''),
    [fontSize, setFontSize] = useState('standard');
  const [scheme, setScheme] = useState('pine');
  const [transitioning, setTransitioning] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const transition = useRef(false);
  const retained = useRef<Workspace | undefined>(undefined);
  const request = useRef('');
  const saving = useRef<Promise<void>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = readyWorkspace(state);
  if (loaded && !suspended) retained.current = loaded;
  const preserved =
    retained.current?.id === state?.activeWorkspaceId ? retained.current : undefined;
  const w = suspended ? preserved : loaded || preserved;
  const available = !!loaded && !suspended;
  const live = useRef({ state, draft, title, prompt, editor: w, available });
  live.current = { state, draft, title, prompt, editor: w, available };
  const session = w?.sessions.find((s) => s.id === w.activeSessionId);
  const doc = w?.documents.find((d) => d.id === session?.documentId);
  const dirty =
    available &&
    doc &&
    (draft !== doc.content || title !== doc.title || prompt !== session?.prompt);
  const pending = session?.proposals.filter((p) => p.status === 'pending') || [];
  const update = (next: Workspace) => {
    if (next.id === live.current.state?.activeWorkspaceId) retained.current = next;
    setState((s) => (s ? replaceWorkspace(s, next) : s));
  };
  const hydrate = (s: AppState) => {
    const w = readyWorkspace(s);
    const se = w?.sessions.find((se) => se.id === w.activeSessionId);
    const d = w?.documents.find((d) => d.id === se?.documentId);
    setState(s);
    retained.current = w;
    setSuspended(false);
    setDraft(d?.content || '');
    setTitle(d?.title || '');
    setPrompt(se?.prompt || '');
    setContextIds([]);
    setStatus('已保存');
  };
  const refresh = (fresh: AppState) => {
    const current = live.current.state;
    if (!current?.activeWorkspaceId) {
      setState({ ...fresh, activeWorkspaceId: null });
      return;
    }
    if (!readyWorkspace(fresh, current.activeWorkspaceId)) setSuspended(true);
    setState(refreshResults(current, fresh));
  };
  useEffect(() => {
    bridge
      .load()
      .then(hydrate)
      .catch((e) => setError(cleanError(e)));
  }, []);
  return {
    state,
    setState,
    draft,
    setDraft,
    title,
    setTitle,
    prompt,
    setPrompt,
    status,
    setStatus,
    error,
    setError,
    notice,
    setNotice,
    view,
    setView,
    focus,
    setFocus,
    panel,
    setPanel,
    dialog,
    setDialog,
    name,
    setName,
    newKind,
    setNewKind,
    settings,
    setSettings,
    key,
    setKey,
    contextIds,
    setContextIds,
    showContext,
    setShowContext,
    busy,
    setBusy,
    action,
    setAction,
    history,
    setHistory,
    query,
    setQuery,
    fontSize,
    setFontSize,
    scheme,
    setScheme,
    live,
    request,
    saving,
    timer,
    w,
    session,
    doc,
    dirty,
    pending,
    update,
    hydrate,
    refresh,
    available,
    suspended,
    setSuspended,
    transitioning,
    setTransitioning,
    transition,
    retained
  };
}
export type ComposerState = ReturnType<typeof useComposerState>;
