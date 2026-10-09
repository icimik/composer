import type { ReadyComposer } from '../composer/useComposer';
import { Feather, Check } from 'lucide-react';

export function Proposals({ c }: { c: ReadyComposer }) {
  const { key, busy, action, doc, pending, run, resolve } = c;
  return (
    <>
      <div className="proposal-heading">
        <span>本会话的提案</span>
        <span>{pending.length.toString().padStart(2, '0')}</span>
      </div>
      {pending.length ? (
        pending.map((p) => (
          <article className="proposal" key={p.id} data-testid="ai-proposal">
            <header>
              <span>
                {p.action === 'polish'
                  ? '表达优化'
                  : p.action === 'continue'
                    ? '续写提案'
                    : '正文提案'}
              </span>
              <time>
                {new Date(p.createdAt).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
            </header>
            <p>{p.text}</p>
            <footer>
              <button onClick={() => void run(() => resolve(p.id, false))}>放弃</button>
              <button
                className="accept"
                disabled={p.docId !== doc.id || busy}
                onClick={() => void run(() => resolve(p.id, true))}
              >
                <Check size={14} />
                采纳
              </button>
            </footer>
            {p.docId !== doc.id && <small>切回对应章节后才能采纳。</small>}
          </article>
        ))
      ) : (
        <div className="proposal-empty">
          <div className="paper-lines">
            <Feather size={23} />
          </div>
          <h3>给灵感一点空间</h3>
          <p>
            描述这一章的任务，或告诉助手
            <br />
            哪些表达需要重新斟酌。
          </p>
        </div>
      )}
    </>
  );
}
