import { useEffect, useCallback } from 'react';
import type { ComposerState } from './useComposerState';
import { bridge, cleanError } from './shared';
export function useWorkspaceActions(model: ComposerState, flush: () => Promise<void>) {
  const {
    state,
    setState,
    setDraft,
    title,
    setTitle,
    prompt,
    setStatus,
    setError,
    setView,
    dialog,
    setDialog,
    name,
    setName,
    newKind,
    setSettings,
    setKey,
    busy,
    setHistory,
    live,
    w,
    session,
    doc,
    update,
    hydrate
  } = model;
  const run = async (fn: () => Promise<void>) => {
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(cleanError(e));
    }
  };
  const switchTo = async (wid: string, sid?: string) => {
    if (busy) throw Error('请先取消生成，再切换工作区或会话。');
    await flush();
    const next = sid ? await bridge.switchSession(wid, sid) : await bridge.switchWorkspace(wid);
    const s = live.current.state!;
    hydrate({
      ...s,
      activeWorkspaceId: wid,
      workspaces: s.workspaces.map((item) => (item.id === next.id ? next : item))
    });
  };
  const selectDoc = async (id: string) => {
    if (busy) throw Error('请先取消生成，再切换章节。');
    await flush();
    const next = await bridge.updateSession(w!.id, session!.id, id, prompt);
    const d = next.documents.find((d) => d.id === id)!;
    update(next);
    setDraft(d.content);
    setTitle(d.title);
    setStatus('已保存');
    setView('write');
  };
  const openSettings = async () => {
    if (!w) return;
    await flush();
    setSettings(await bridge.getSettings(w.id));
    setKey('');
    setDialog('settings');
  };
  const openHistory = async () => {
    await flush();
    setHistory(await bridge.snapshots(w!.id, doc!.id));
    setDialog('history');
  };
  const theme = async () => {
    const next = state?.theme === 'dark' ? 'light' : 'dark';
    await bridge.setTheme(next);
    setState((s) => (s ? { ...s, theme: next } : s));
  };
  const create = async () => {
    if (busy) throw Error('请先取消生成，再创建工作区、会话或文档。');
    await flush();
    if (dialog === 'workspace') {
      const s = await bridge.createWorkspace(name);
      hydrate(s);
    }
    if (dialog === 'session') {
      const next = await bridge.createSession(w!.id, name);
      const s = live.current.state!;
      hydrate({ ...s, workspaces: s.workspaces.map((w) => (w.id === next.id ? next : w)) });
    }
    if (dialog === 'document') {
      const d = await bridge.createDocument(w!.id, name, newKind);
      const next = await bridge.updateSession(w!.id, session!.id, d.id, prompt);
      update(next);
      setDraft('');
      setTitle(d.title);
      setView('write');
    }
    setDialog('');
    setName('');
  };
  return { run, switchTo, selectDoc, openSettings, openHistory, theme, create };
}
