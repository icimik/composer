import { useRef } from 'react';
import type { ComposerState } from './useComposerState';
import { bridge } from './shared';
import { readyWorkspace } from './workspaceState';
import { useTransition } from './useTransition';
import { requestTracker } from './revisionRequest';
import { revisionFailure } from './revisionFailure';

export function useRevisionActions(model: ComposerState, flush: () => Promise<void>) {
  const transition = useTransition(model, flush);
  const requests = useRef(requestTracker());
  const restoreSnapshot = (snapshotId: string) =>
    transition(async () => {
      if (!model.available) throw Error('当前工作区不可写。');
      const w = readyWorkspace(model.live.current.state)!;
      const session = w.sessions.find((s) => s.id === w.activeSessionId)!;
      const doc = w.documents.find((d) => d.id === session.documentId)!;
      const identity = requests.current.get(
        [w.id, doc.id, snapshotId, doc.hash, doc.title],
        doc.title
      );
      const restored = await bridge
        .restore(w.id, doc.id, snapshotId, doc.hash, identity)
        .catch((error: unknown) => revisionFailure(model, error));
      requests.current.complete();
      model.update({
        ...w,
        documents: w.documents.map((d) => (d.id === restored.id ? restored : d))
      });
      model.setDraft(restored.content);
      model.setTitle(restored.title);
      model.setDialog('');
      model.setNotice('已恢复快照，恢复前的正文也已保留。');
    });
  return { restoreSnapshot };
}
