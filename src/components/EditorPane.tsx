import type { ReadyComposer } from '../composer/useComposer';
import { X } from 'lucide-react';
import { SessionBar } from './SessionBar';
import { EditorToolbar } from './EditorToolbar';
import { EditorFooter } from './EditorFooter';
import { Manuscript } from './Manuscript';
import { Outline } from './Outline';
import { Review } from './Review';
export function EditorPane({ c }: { c: ReadyComposer }) {
  const { error, setError, notice, setNotice, dialog } = c;
  return (
    <>
      <main className="main-pane">
        <SessionBar c={c} />
        <EditorToolbar c={c} />
        {error && !dialog && (
          <div className="message error" role="alert">
            <span>{error}</span>
            <button aria-label="关闭错误提示" onClick={() => setError('')}>
              <X size={15} />
            </button>
          </div>
        )}
        {notice && (
          <div className="message success" role="status">
            <span>{notice}</span>
            <button aria-label="关闭通知" onClick={() => setNotice('')}>
              <X size={15} />
            </button>
          </div>
        )}
        <Manuscript c={c} />
        <Outline c={c} />
        <Review c={c} />
        <EditorFooter c={c} />
      </main>
    </>
  );
}
