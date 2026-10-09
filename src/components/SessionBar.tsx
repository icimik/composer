import type { ReadyComposer } from '../composer/useComposer';
import { Plus } from 'lucide-react';

export function SessionBar({ c }: { c: ReadyComposer }) {
  const { setDialog, name, setName, key, busy, w, session, run, switchTo } = c;
  return (
    <>
      <div className="session-bar">
        <div className="session-tabs" role="tablist" aria-label="创作会话">
          {w.sessions.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === session.id}
              className={s.id === session.id ? 'active' : ''}
              onClick={() => void run(() => switchTo(w.id, s.id))}
              disabled={busy}
            >
              <span className="tab-dot" />
              {s.name}
            </button>
          ))}
          <button
            className="icon-button"
            aria-label="新建会话"
            onClick={() => {
              setName('');
              setDialog('session');
            }}
          >
            <Plus size={16} />
          </button>
        </div>
        <span className="session-hint">会话独立保留文档与 AI 提案</span>
      </div>
    </>
  );
}
