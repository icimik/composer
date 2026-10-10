import type { ReadyComposer } from '../composer/useComposer';
import { RotateCcw } from 'lucide-react';
import { bridge } from '../composer/shared';

export function HistoryDialog({ c }: { c: ReadyComposer }) {
  const {
    setDraft,
    title,
    setTitle,
    setNotice,
    dialog,
    setDialog,
    key,
    history,
    w,
    doc,
    update,
    run
  } = c;
  return (
    <>
      {dialog === 'history' && (
        <div className="history-list">
          <p className="dialog-description">
            保存变化前的整篇内容。恢复也会先保留当前正文，便于再次恢复。
          </p>
          {history.length ? (
            history
              .slice()
              .reverse()
              .map((s) => (
                <article key={s.id}>
                  <header>
                    <strong>{s.title}</strong>
                    <time>{new Date(s.createdAt).toLocaleString('zh-CN')}</time>
                  </header>
                  <p>{s.content.slice(0, 160) || '空白正文'}</p>
                  <button
                    onClick={() =>
                      void run(async () => {
                        await c.restoreSnapshot(s.id);
                      })
                    }
                  >
                    <RotateCcw size={14} />
                    恢复此版本
                  </button>
                </article>
              ))
          ) : (
            <p>还没有快照。修改并保存正文后，上一版会出现在这里。</p>
          )}
        </div>
      )}
    </>
  );
}
