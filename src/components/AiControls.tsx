import type { ReadyComposer } from '../composer/useComposer';
import { Plus, ArrowUpRight, Sparkles, ChevronDown } from 'lucide-react';
import { bridge } from '../composer/shared';

export function AiControls({ c }: { c: ReadyComposer }) {
  const {
    title,
    prompt,
    setPrompt,
    key,
    contextIds,
    setContextIds,
    showContext,
    setShowContext,
    busy,
    action,
    setAction,
    request,
    w,
    run,
    generate,
    isChapter
  } = c;
  return (
    <>
      <div className="action-tabs" role="group" aria-label="AI 任务类型">
        {(
          [
            ['generate', '生成'],
            ['continue', '续写'],
            ['polish', '优化表达']
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={action === id ? 'active' : ''}
            onClick={() => setAction(id)}
            disabled={busy}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="prompt-label" htmlFor="ai-prompt">
        {action === 'polish' ? '希望怎样调整表达？' : '这一章要发生什么？'}
      </label>
      <textarea
        id="ai-prompt"
        value={prompt}
        maxLength={10000}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={
          action === 'polish'
            ? '例如：让对白更自然，删去情绪总结，保留事件和人物关系。'
            : '人物想要什么？什么挡住了他？这次行动要付出什么代价？'
        }
      />
      <button className="context-toggle" onClick={() => setShowContext(!showContext)}>
        <Plus size={14} />
        参考设定<span>{contextIds.length} 项</span>
        <ChevronDown size={14} />
      </button>
      {showContext && (
        <div className="context-list">
          {w.documents.filter((d) => d.kind !== 'chapter').length ? (
            w.documents
              .filter((d) => d.kind !== 'chapter')
              .map((d) => (
                <label key={d.id}>
                  <input
                    type="checkbox"
                    checked={contextIds.includes(d.id)}
                    onChange={(e) =>
                      setContextIds(
                        e.target.checked
                          ? [...contextIds, d.id]
                          : contextIds.filter((id) => id !== d.id)
                      )
                    }
                  />
                  {d.title}
                </label>
              ))
          ) : (
            <p>先新建人物、世界观或风格规范，再作为参考。</p>
          )}
        </div>
      )}
      <div className="context-summary">
        <span>发送范围</span>
        <p>当前章全文 + 指令 + 所选设定 + 中文生成约束。不会发送其他工作区或会话。</p>
      </div>
      {busy ? (
        <button
          className="primary-button"
          onClick={() =>
            void run(async () => {
              await bridge.cancel(request.current);
            })
          }
        >
          取消生成
        </button>
      ) : (
        <button
          className="primary-button"
          onClick={() => void run(generate)}
          disabled={!isChapter || !prompt.trim()}
        >
          <Sparkles size={15} />
          {action === 'polish' ? '生成优化提案' : '生成正文提案'}
          <ArrowUpRight size={15} />
        </button>
      )}
      <p className="privacy-note">
        调用你配置的模型服务，可能产生费用。
        <br />
        结果先成为提案，采纳前不会覆盖正文。
      </p>
    </>
  );
}
