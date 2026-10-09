import { useEffect, useCallback } from 'react';
import type { ComposerState } from './useComposerState';

export function useUiEffects(model: ComposerState, flush: () => Promise<void>) {
  const { state, focus, setFocus, setDialog, key, scheme, pending } = model;
  useEffect(() => {
    if (pending.length)
      requestAnimationFrame(() =>
        document
          .querySelector('.ai-content .proposal:last-child')
          ?.scrollIntoView({ block: 'nearest' })
      );
  }, [pending.length]);
  useEffect(() => {
    document.documentElement.dataset.theme = state?.theme || 'light';
  }, [state?.theme]);
  useEffect(() => {
    document.documentElement.dataset.scheme = scheme;
  }, [scheme]);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void flush().catch(() => {});
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setDialog('commands');
      }
      if (e.key === 'F8') {
        e.preventDefault();
        setFocus((f) => !f);
      }
      if (e.key === 'Escape' && focus) setFocus(false);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [flush, focus]);
}
