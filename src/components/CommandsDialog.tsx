import type { ReadyComposer } from '../composer/useComposer';
import { ArrowUpRight } from 'lucide-react';

export function CommandsDialog({ c }: { c: ReadyComposer }) {
  const {
    setView,
    focus,
    setFocus,
    dialog,
    setDialog,
    setName,
    setNewKind,
    key,
    query,
    setQuery,
    flush,
    run,
    openSettings
  } = c;
  return (
    <>
      {dialog === 'commands' && (
        <div className="commands">
          <input
            aria-label="搜索操作"
            autoFocus
            placeholder="搜索操作…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {[
            {
              label: '新建章节',
              fn: () => {
                setNewKind('chapter');
                setName('');
                setDialog('document');
              }
            },
            {
              label: '新建工作区',
              fn: () => {
                setName('');
                setDialog('workspace');
              }
            },
            {
              label: '新建会话',
              fn: () => {
                setName('');
                setDialog('session');
              }
            },
            { label: '模型设置', fn: () => void run(openSettings) },
            {
              label: '结构总览',
              fn: () => {
                setView('outline');
                setDialog('');
              }
            },
            {
              label: '阶段检查',
              fn: () => {
                setView('review');
                setDialog('');
              }
            },
            {
              label: '切换专注模式',
              fn: () => {
                setFocus(!focus);
                setDialog('');
              }
            },
            {
              label: '保存当前文档',
              fn: () => {
                void run(flush);
                setDialog('');
              }
            }
          ]
            .filter((item) => item.label.includes(query))
            .map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setQuery('');
                  item.fn();
                }}
              >
                {item.label}
                <ArrowUpRight size={15} />
              </button>
            ))}
        </div>
      )}
    </>
  );
}
