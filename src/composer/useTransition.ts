import type { ComposerState } from './useComposerState';

export function useTransition(model: ComposerState, flush: () => Promise<void>) {
  return async (fn: () => Promise<void>, save = true) => {
    if (model.transition.current) throw Error('正在切换或重试，请稍候。');
    if (model.busy) throw Error('请先取消生成，再切换工作区或会话。');
    model.transition.current = true;
    model.setTransitioning(true);
    try {
      if (save) await flush();
      await fn();
    } finally {
      model.transition.current = false;
      model.setTransitioning(false);
    }
  };
}
