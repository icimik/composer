import type { ReadyComposer } from '../composer/useComposer';
import {
  ListTree,
  Feather,
  Plus,
  ArrowUpRight,
  Check,
  FolderOpen,
  Download,
  ChevronDown
} from 'lucide-react';
import { bridge, kinds, checkLabels } from '../composer/shared';

export function Sidebar({ c }: { c: ReadyComposer }) {
  const {
    state,
    title,
    setNotice,
    view,
    setView,
    setDialog,
    name,
    setName,
    setNewKind,
    key,
    busy,
    w,
    doc,
    hydrate,
    flush,
    run,
    switchTo,
    selectDoc,
    total
  } = c;
  return (
    <>
      <aside className="sidebar" aria-label="工作区导航">
        <div className="workspace-switch">
          <label htmlFor="workspace-select">工作区</label>
          <div className="select-wrap">
            <select
              id="workspace-select"
              value={w.id}
              onChange={(e) => void run(() => switchTo(e.target.value))}
              disabled={busy || c.transitioning}
            >
              {state.workspaces.map((w) => (
                <option key={w.id} value={w.id} disabled={w.status === 'unavailable'}>
                  {w.name}
                  {w.status === 'unavailable' ? '（无法打开）' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} />
          </div>
          <div className="workspace-tools">
            <button
              onClick={() => {
                setName('');
                setDialog('workspace');
              }}
            >
              <Plus size={14} />
              新建
            </button>
            <button disabled={c.transitioning} onClick={() => void run(c.openWorkspace)}>
              <FolderOpen size={14} />
              打开目录
            </button>
          </div>
        </div>
        <nav className="primary-nav" aria-label="视图">
          <button className={view === 'write' ? 'selected' : ''} onClick={() => setView('write')}>
            <Feather size={17} />
            创作
          </button>
          <button
            className={view === 'outline' ? 'selected' : ''}
            onClick={() => setView('outline')}
          >
            <ListTree size={17} />
            结构总览
          </button>
          <button className={view === 'review' ? 'selected' : ''} onClick={() => setView('review')}>
            <Check size={17} />
            阶段检查
            <span className="nav-count">
              {w.checks.length}/{checkLabels.length}
            </span>
          </button>
        </nav>
        <div className="section-heading">
          <span>作品资料</span>
          <button
            className="icon-button small"
            aria-label="新建文档"
            onClick={() => {
              setName('');
              setNewKind('chapter');
              setDialog('document');
            }}
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="document-tree">
          {kinds.map(({ id, label, icon: Icon }) => (
            <section key={id} className="tree-group">
              <h3>
                <Icon size={14} />
                {label}
                <span>
                  {w.documents
                    .filter((d) => d.kind === id)
                    .length.toString()
                    .padStart(2, '0')}
                </span>
              </h3>
              {w.documents
                .filter((d) => d.kind === id)
                .map((d, i) => (
                  <button
                    key={d.id}
                    className={`document-link ${d.id === doc.id ? 'active' : ''}`}
                    onClick={() => void run(() => selectDoc(d.id))}
                    disabled={busy}
                  >
                    <span className="document-number">{(i + 1).toString().padStart(2, '0')}</span>
                    <span>{d.title}</span>
                    {d.id === doc.id && <span className="active-dot" />}
                  </button>
                ))}
            </section>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="progress-label">
            <span>创作进度</span>
            <span>
              {total.toLocaleString('zh-CN')} / {w.target.toLocaleString('zh-CN')} 字
            </span>
          </div>
          <progress value={Math.min(total, w.target)} max={w.target} />
          <p>自己的节奏，比进度更重要。</p>
          <button
            onClick={() =>
              void run(async () => {
                await flush();
                const p = await bridge.exportWorkspace(w.id);
                if (p) setNotice('已导出 Markdown 文稿。');
              })
            }
          >
            <Download size={15} />
            导出文稿
            <ArrowUpRight size={14} />
          </button>
        </div>
      </aside>
    </>
  );
}
