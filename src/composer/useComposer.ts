import { useComposerState } from './useComposerState';
import { useSave } from './useSave';
import { useWorkspaceActions } from './useWorkspaceActions';
import { useAiActions } from './useAiActions';
import { useUiEffects } from './useUiEffects';
import { useRevisionActions } from './useRevisionActions';
import type { AppState, Workspace, Document, Session } from '../types';
export function useComposer() {
  const model = useComposerState();
  const { flush } = useSave(model);
  const actions = useWorkspaceActions(model, flush);
  const ai = useAiActions(model, flush);
  const revisions = useRevisionActions(model, flush);
  useUiEffects(model, flush);
  return { ...model, flush, ...actions, ...ai, ...revisions };
}
export type ComposerController = ReturnType<typeof useComposer>;
export type ReadyComposer = Omit<ComposerController, 'state' | 'w' | 'doc' | 'session'> & {
  state: AppState;
  w: Workspace;
  doc: Document;
  session: Session;
  total: number;
  isChapter: boolean;
};
