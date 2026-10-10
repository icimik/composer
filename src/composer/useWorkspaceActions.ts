import { useEffect, useCallback } from 'react';
import type { ComposerState } from './useComposerState';
import { bridge, cleanError } from './shared';
import { replaceWorkspace, hasChanges } from './workspaceState';
import { useTransition } from './useTransition';
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
  const transition = useTransition(model, flush);
  const canLeave = () => {
    const current = live.current;
    if (
      !current.available &&
      hasChanges(current.editor, current.draft, current.title, current.prompt)
    )
      throw Error('当前工作区仍有未保存输入，请先修复并重新打开；编辑区内容已保留。');
  };
  const run = async (fn: () => Promise<void>) => {
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(cleanError(e));
    }
  };
  const switchTo = async (wid: string, sid?: string) => {
    if (sid && !model.available) throw Error('当前工作区不可写。');
    if (wid !== live.current.state?.activeWorkspaceId) canLeave();
    await transition(async () => {
      const result = sid
        ? { status: 'selected' as const, workspace: await bridge.switchSession(wid, sid) }
        : await bridge.switchWorkspace(wid);
      const s = live.current.state!;
      if (result.status === 'unavailable') {
        if (wid === s.activeWorkspaceId) model.setSuspended(true);
        setState({ ...s, workspaces: s.workspaces.map((w) => (w.id === wid ? result : w)) });
        throw Error(result.diagnostic.message);
      }
      const next = result.workspace;
      if (
        !sid &&
        wid === s.activeWorkspaceId &&
        model.retained.current &&
        hasChanges(
          model.retained.current,
          live.current.draft,
          live.current.title,
          live.current.prompt
        )
      ) {
        setState(replaceWorkspace(s, model.retained.current));
        model.setSuspended(false);
        return;
      }
      hydrate({
        ...replaceWorkspace(s, next),
        activeWorkspaceId: wid,
        requestedActiveWorkspaceId: wid
      });
    }, model.available);
  };
  const selectDoc = async (id: string) => {
    if (!model.available) throw Error('当前工作区不可写。');
    await transition(async () => {
      const next = await bridge.updateSession(w!.id, session!.id, id, prompt);
      const d = next.documents.find((d) => d.id === id)!;
      update(next);
      setDraft(d.content);
      setTitle(d.title);
      setStatus('已保存');
      setView('write');
    });
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
    canLeave();
    if (dialog !== 'workspace' && !model.available) throw Error('当前工作区不可写。');
    await transition(async () => {
      if (dialog === 'workspace') {
        const s = await bridge.createWorkspace(name);
        hydrate(s);
      }
      if (dialog === 'session') {
        const next = await bridge.createSession(w!.id, name);
        const s = live.current.state!;
        hydrate(replaceWorkspace(s, next));
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
    }, model.available);
  };
  const openWorkspace = () =>
    transition(async () => {
      canLeave();
      const s = await bridge.openWorkspace();
      if (s) hydrate(s);
    }, model.available);
  const retry = () =>
    transition(async () => {
      model.refresh(await bridge.load());
    }, false);
  const newWorkspace = (name: string) =>
    transition(async () => {
      canLeave();
      hydrate(await bridge.createWorkspace(name));
    }, model.available);
  return {
    run,
    switchTo,
    selectDoc,
    openSettings,
    openHistory,
    theme,
    create,
    openWorkspace,
    retry,
    newWorkspace
  };
}
