import { useRef } from 'react';
import type { ComposerState } from './useComposerState';
import { bridge } from './shared';
import { readyWorkspace } from './workspaceState';
import { useTransition } from './useTransition';
import { requestTracker } from './revisionRequest';
import { revisionFailure } from './revisionFailure';
export function useAiActions(model: ComposerState, flush: () => Promise<void>) {
  const revisions = useRef(requestTracker());
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
  const transition = useTransition(model, flush);
  const generate = async () => {
    if (!model.available || model.transition.current) throw Error('当前工作区不可写或正在切换。');
    await flush();
    const current = readyWorkspace(live.current.state, w!.id)!;
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
    if (!model.available || model.transition.current) throw Error('当前工作区不可写或正在切换。');
    await transition(async () => {
      const current = readyWorkspace(live.current.state, w!.id)!;
      const d = current.documents.find((d) => d.id === doc!.id)!;
      const identity = revisions.current.get([w!.id, session!.id, pid, d.hash, d.title], d.title);
      const next = await bridge
        .resolveProposal(w!.id, session!.id, pid, accept, identity)
        .catch((error: unknown) => revisionFailure(model, error));
      revisions.current.complete();
      update(next);
      const resolved = next.documents.find((d) => d.id === doc!.id)!;
      setDraft(resolved.content);
      setTitle(resolved.title);
      setNotice(accept ? '已采纳，原文已保留为历史快照。' : '已放弃提案，正文未改动。');
    });
  };
  return { generate, resolve };
}
