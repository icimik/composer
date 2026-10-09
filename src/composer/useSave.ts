import { useEffect, useCallback } from 'react';
import type { ComposerState } from './useComposerState';
import { bridge, cleanError } from './shared';
export function useSave(model: ComposerState) {
  const {
    state,
    setState,
    draft,
    title,
    prompt,
    setStatus,
    setError,
    live,
    saving,
    timer,
    w,
    dirty
  } = model;
  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    // Serialize renderer saves so a queued save reads the latest returned revision.
    const task = saving.current.then(async () => {
      const { state: s, draft, title, prompt } = live.current;
      if (!s) return;
      const w = s.workspaces.find((w) => w.id === s.activeWorkspaceId)!;
      const se = w.sessions.find((se) => se.id === w.activeSessionId)!;
      const d = w.documents.find((d) => d.id === se.documentId)!;
      if (draft === d.content && title === d.title && prompt === se.prompt) return;
      setStatus('保存中');
      try {
        let result = d;
        if (draft !== d.content || title !== d.title)
          result = await bridge.saveDocument(w.id, d.id, title, draft, d.hash);
        const next = await bridge.updateSession(w.id, se.id, d.id, prompt);
        next.documents = next.documents.map((item) => (item.id === result.id ? result : item));
        // Preserve edits made while the save was in flight.
        const current = live.current.state;
        if (current) {
          const updated = {
            ...current,
            workspaces: current.workspaces.map((item) => (item.id === next.id ? next : item))
          };
          live.current.state = updated;
          setState(updated);
        }
        setStatus(
          live.current.draft === result.content &&
            live.current.title === result.title &&
            live.current.prompt === prompt
            ? '已保存'
            : '待保存'
        );
      } catch (e) {
        setStatus('保存失败');
        setError(cleanError(e));
        throw e;
      }
    });
    saving.current = task.catch(() => {});
    return task;
  }, []);
  useEffect(() => {
    if (!dirty) return;
    setStatus('待保存');
    timer.current = setTimeout(() => {
      void flush().catch(() => {});
    }, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [draft, title, prompt, dirty, flush]);
  useEffect(() => {
    const fn = () => {
      void flush()
        .then(() => {
          (window as Window & { composerClose?: () => Promise<void> }).composerClose?.();
        })
        .catch(() => {});
    };
    window.addEventListener('composer-before-close', fn);
    return () => window.removeEventListener('composer-before-close', fn);
  }, [flush]);
  return { flush };
}
