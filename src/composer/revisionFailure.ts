import type { ComposerState } from './useComposerState';
import { bridge } from './shared';

export async function revisionFailure(model: ComposerState, error: unknown): Promise<never> {
  try {
    model.refresh(await bridge.load());
  } catch {
    // An untrusted global index must not reset or replace the retained editor.
  }
  throw error;
}
