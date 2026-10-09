import type { ReadyComposer } from '../composer/useComposer';
import { count } from '../composer/shared';

export function Manuscript({ c }: { c: ReadyComposer }) {
  const { draft, setDraft, title, setTitle, view, fontSize, w, isChapter } = c;
  return (
    <>
      {view === 'write' && (
        <div className={`writing-area ${fontSize}`}>
          <div className="chapter-meta">
            <span>{isChapter ? 'MANUSCRIPT' : 'STORY BIBLE'}</span>
            <span>
              {w.stage} · {isChapter ? '章节草稿' : '项目资料'}
            </span>
          </div>
          <input
            className="chapter-title"
            aria-label="文档标题"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="chapter-subline">
            <span>
              {isChapter
                ? '把故事写下来，其他事可以稍后再说。'
                : '好的设定，是人物行动时可以依靠的东西。'}
            </span>
            <span>{count(draft).toLocaleString('zh-CN')} 字</span>
          </div>
          <textarea
            className="manuscript"
            aria-label="正文编辑器"
            data-testid="manuscript"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            placeholder={
              isChapter
                ? '从一个动作、一件物品，或一句没说完的话开始。'
                : '记录设定、创作边界与需要保持一致的细节。'
            }
          />
          <div className="end-mark" aria-hidden="true">
            <span />◇<span />
          </div>
        </div>
      )}
    </>
  );
}
