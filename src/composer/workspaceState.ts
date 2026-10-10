import type { AppState, Workspace, WorkspaceResult } from '../types';

export function readyResult(workspace: Workspace): WorkspaceResult {
  return { status: 'ready', id: workspace.id, name: workspace.name, workspace };
}
export function readyWorkspace(state: AppState | null, id = state?.activeWorkspaceId) {
  const result = state?.workspaces.find((w) => w.id === id);
  return result?.status === 'ready' ? result.workspace : undefined;
}
export function replaceWorkspace(state: AppState, workspace: Workspace): AppState {
  return {
    ...state,
    workspaces: state.workspaces.map((w) => (w.id === workspace.id ? readyResult(workspace) : w))
  };
}
export function refreshResults(current: AppState, fresh: AppState): AppState {
  const baseline = readyWorkspace(current);
  return {
    ...fresh,
    activeWorkspaceId: current.activeWorkspaceId,
    workspaces: fresh.workspaces.map((w) =>
      baseline && w.id === baseline.id && w.status === 'ready' ? readyResult(baseline) : w
    )
  };
}
export function hasChanges(
  editor: Workspace | undefined,
  draft: string,
  title: string,
  prompt: string
) {
  const session = editor?.sessions.find((s) => s.id === editor.activeSessionId);
  const doc = editor?.documents.find((d) => d.id === session?.documentId);
  return !!doc && (draft !== doc.content || title !== doc.title || prompt !== session?.prompt);
}
