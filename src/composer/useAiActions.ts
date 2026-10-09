import { useEffect, useCallback } from 'react';
import type { ComposerState } from './useComposerState';
import { bridge } from './shared';
export function useAiActions(model: ComposerState, flush: () => Promise<void>) {
  const {
    state,
    setDraft,
    title,
    setTitle,
    prompt,
    setNotice,
    contextIds,
    setBusy,
    action,
    live,
    request,
    w,
    session,
    doc,
    update
  } = model;
  const generate = async () => {
    await flush();
    const current = live.current.state!.workspaces.find((item) => item.id === w!.id)!;
    if (current.documents.find((d) => d.id === doc!.id)!.content.trim() && action === 'generate')
      throw Error('已有正文，请选择续写或优化表达；新生成用于空章节。');
    setBusy(true);
    setNotice('');
    const id = crypto.randomUUID();
    request.current = id;
    try {
      await bridge.generate(w!.id, session!.id, doc!.id, action, prompt, contextIds, id);
      const next = await bridge.switchSession(w!.id, session!.id);
      update(next);
      setNotice('提案已生成，正文尚未改动。');
    } finally {
      setBusy(false);
      request.current = '';
    }
  };
  const resolve = async (pid: string, accept: boolean) => {
    await flush();
    const next = await bridge.resolveProposal(w!.id, session!.id, pid, accept);
    update(next);
    const d = next.documents.find((d) => d.id === doc!.id)!;
    setDraft(d.content);
    setTitle(d.title);
    setNotice(accept ? '已采纳，原文已保留为历史快照。' : '已放弃提案，正文未改动。');
  };
  return { generate, resolve };
}
