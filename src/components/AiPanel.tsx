import type { ReadyComposer } from '../composer/useComposer';
import { Settings2, Sparkles } from 'lucide-react';
import { AiControls } from './AiControls';
import { Proposals } from './Proposals';
export function AiPanel({ c }: { c: ReadyComposer }) {
  const { run, openSettings } = c;
  return (
    <>
      <aside className="ai-panel" aria-label="AI 创作助手">
        <div className="ai-heading">
          <div>
            <Sparkles size={17} />
            <strong>创作助手</strong>
          </div>
          <button
            className="icon-button"
            aria-label="模型设置"
            onClick={() => void run(openSettings)}
          >
            <Settings2 size={17} />
          </button>
        </div>
        <div className="ai-content">
          <p className="assistant-lead">
            你决定故事。
            <br />
            <span>AI 帮你找到另一种表达。</span>
          </p>
          <AiControls c={c} />
          <Proposals c={c} />
        </div>
        <div className="ai-panel-footer">
          <span className="local-mark" />
          <span>作者始终拥有最后决定权</span>
        </div>
      </aside>
    </>
  );
}
