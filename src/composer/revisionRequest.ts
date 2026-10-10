import type { RevisionIdentity } from '../types';

export function requestTracker() {
  let pending: { key: string; identity: RevisionIdentity } | undefined;
  return {
    get(parts: string[], expectedTitle: string) {
      const key = JSON.stringify(parts);
      if (!pending || pending.key !== key)
        pending = { key, identity: { operationId: crypto.randomUUID(), expectedTitle } };
      return pending.identity;
    },
    complete() {
      pending = undefined;
    }
  };
}
