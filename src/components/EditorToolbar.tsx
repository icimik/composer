import type { ReadyComposer } from '../composer/useComposer';
import { BookOpen, PanelRightClose, PanelRightOpen, Focus, Clock3, Check } from 'lucide-react';
import { kinds } from '../composer/shared';

export function EditorToolbar({ c }: { c: ReadyComposer }) {
  const { status, focus, setFocus, panel, setPanel, name, w, doc, run, openHistory } = c;
  return (
    <>
      <div className="editor-toolbar">
        <div className="breadcrumb">
          <BookOpen size={15} />
          <span>{w.name}</span>
          <span>/</span>
          <span>{kinds.find((k) => k.id === doc.kind)?.label}</span>
        </div>
        <div className="toolbar-actions">
          <span
            className={`save-status ${status === '保存失败' ? 'failure' : ''}`}
            role="status"
            data-testid="save-status"
          >
            {status === '已保存' && <Check size={13} />} {status}
          </span>
          <button
            className="icon-button"
            aria-label="历史快照"
            onClick={() => void run(openHistory)}
          >
            <Clock3 size={17} />
          </button>
          <button
            className="icon-button"
            aria-label={focus ? '退出专注模式' : '进入专注模式'}
            onClick={() => setFocus(!focus)}
          >
            <Focus size={17} />
          </button>
          <button
            className="icon-button"
            aria-label={panel ? '收起 AI 面板' : '展开 AI 面板'}
            onClick={() => setPanel(!panel)}
          >
            {panel ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
          </button>
        </div>
      </div>
    </>
  );
}
