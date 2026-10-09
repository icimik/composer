import { useComposer } from './composer/useComposer';
import { desktop, count } from './composer/shared';
import { Logo } from './components/Logo';
import { AppHeader } from './components/AppHeader';
import { AiPanel } from './components/AiPanel';
import { Sidebar } from './components/Sidebar';
import { EditorPane } from './components/EditorPane';
import { ComposerDialogs } from './components/ComposerDialogs';
export function App() {
  const c = useComposer();
  const { state, w, doc, session, error, focus, panel } = c;
  if (!state || !w || !doc || !session)
    return (
      <main className="loading">
        <Logo />
        <h1>Icimik Composer</h1>
        <p role={error ? 'alert' : 'status'}>{error || '正在打开本地工作区…'}</p>
      </main>
    );
  const total = w.documents
    .filter((d) => d.kind === 'chapter')
    .reduce((n, d) => n + count(d.id === doc.id ? c.draft : d.content), 0);
  const ready = { ...c, state, w, doc, session, total, isChapter: doc.kind === 'chapter' };
  return (
    <div
      className={`app ${focus ? 'focused' : ''} ${panel ? '' : 'panel-hidden'}`}
      data-testid="composer-app"
    >
      {!desktop && (
        <div className="preview-banner">
          界面预览 · 内容仅在本次浏览中暂存，关闭后不保留；本地文件与 AI 功能请使用桌面 App。
        </div>
      )}
      <AppHeader c={ready} />
      <div className="workspace-layout">
        <Sidebar c={ready} />
        <EditorPane c={ready} />
        <AiPanel c={ready} />
      </div>
      <ComposerDialogs c={ready} />
    </div>
  );
}
