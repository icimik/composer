import type { ReadyComposer } from '../composer/useComposer';
import { Plus, ArrowUpRight } from 'lucide-react';
import { count } from '../composer/shared';

export function Outline({ c }: { c: ReadyComposer }) {
  const { title, view, setDialog, setName, setNewKind, key, w, run, selectDoc } = c;
  return (
    <>
      {view === 'outline' && (
        <section className="overview">
          <p className="eyebrow">STRUCTURE</p>
          <h1>让故事有迹可循</h1>
          <p>每一章都承担自己的叙事任务。点击卡片，回到正文。</p>
          <div className="chapter-grid">
            {w.documents
              .filter((d) => d.kind === 'chapter')
              .map((d, i) => (
                <button
                  className="chapter-card"
                  key={d.id}
                  onClick={() => void run(() => selectDoc(d.id))}
                >
                  <span>CHAPTER {(i + 1).toString().padStart(2, '0')}</span>
                  <h2>{d.title}</h2>
                  <p>{d.content.slice(0, 120) || '还没有正文。留一点空间，让故事开始。'}</p>
                  <footer>
                    {count(d.content)} 字<ArrowUpRight size={16} />
                  </footer>
                </button>
              ))}
            <button
              className="chapter-card add-card"
              onClick={() => {
                setNewKind('chapter');
                setName('');
                setDialog('document');
              }}
            >
              <Plus size={24} />
              <span>添加下一章</span>
            </button>
          </div>
        </section>
      )}
    </>
  );
}
