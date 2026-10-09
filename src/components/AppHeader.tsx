import type { ReadyComposer } from '../composer/useComposer';
import { Moon, Sun, Search, CircleHelp } from 'lucide-react';
import { Logo } from './Logo';
export function AppHeader({ c }: { c: ReadyComposer }) {
  const { state, setDialog, name, w, run, theme } = c;
  return (
    <>
      <header className="app-header">
        <div className="brand">
          <Logo />
          <strong>
            Icimik <span>Composer</span>
          </strong>
          <span className="version">0.1</span>
        </div>
        <div className="header-center">
          <span className="local-mark" />
          <span>本地工作区</span>
          <span className="slash">/</span>
          <span>{w.name}</span>
        </div>
        <div className="header-actions">
          <button
            onClick={() => setDialog('commands')}
            className="command-button"
            aria-label="打开命令面板"
          >
            <Search size={15} />
            <span>快速操作</span>
            <kbd>⌘ / Ctrl K</kbd>
          </button>
          <button className="icon-button" aria-label="切换明暗主题" onClick={() => void run(theme)}>
            {state.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="icon-button" aria-label="使用说明" onClick={() => setDialog('help')}>
            <CircleHelp size={17} />
          </button>
        </div>
      </header>
    </>
  );
}
