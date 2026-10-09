import type { ReadyComposer } from '../composer/useComposer';

export function EditorFooter({ c }: { c: ReadyComposer }) {
  const { fontSize, setFontSize, scheme, setScheme, flush, run, isChapter } = c;
  return (
    <>
      <footer className="editor-status">
        <span>
          {isChapter ? '中文写作' : '设定编辑'}
          <span className="dot-separator">·</span>UTF-8<span className="dot-separator">·</span>
          Markdown
        </span>
        <div>
          <select aria-label="配色方案" value={scheme} onChange={(e) => setScheme(e.target.value)}>
            <option value="pine">松墨</option>
            <option value="mono">石墨</option>
          </select>
          <label>
            字号
            <select
              aria-label="阅读字号"
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
            >
              <option value="standard">标准</option>
              <option value="large">较大</option>
            </select>
          </label>
          <button onClick={() => void run(flush)}>
            保存 <kbd>⌘ / Ctrl S</kbd>
          </button>
        </div>
      </footer>
    </>
  );
}
