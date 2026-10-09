import type { ReadyComposer } from '../composer/useComposer';
import { Feather } from 'lucide-react';
import { bridge, checkLabels, stages } from '../composer/shared';

export function Review({ c }: { c: ReadyComposer }) {
  const { view, key, w, update, run } = c;
  return (
    <>
      {view === 'review' && (
        <section className="overview">
          <p className="eyebrow">FRAMEWORK</p>
          <h1>先保结构，再修表达</h1>
          <p>这些是作者的检查记录，不是 AI 自动验收。完整多角色审阅在后续版本接入。</p>
          <label className="field stage-field">
            当前阶段
            <select
              value={w.stage}
              onChange={(e) => {
                const stage = e.target.value;
                update({ ...w, stage });
                void run(async () => update(await bridge.updateWorkspace(w.id, { stage })));
              }}
            >
              {stages.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <div className="review-list">
            {checkLabels.map((label) => (
              <label key={label}>
                <input
                  type="checkbox"
                  checked={w.checks.includes(label)}
                  onChange={(e) => {
                    const checks = e.target.checked
                      ? [...w.checks, label]
                      : w.checks.filter((c) => c !== label);
                    update({ ...w, checks });
                    void run(async () => update(await bridge.updateWorkspace(w.id, { checks })));
                  }}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="review-note">
            <Feather size={22} />
            <p>
              规则帮助你作出判断，不替你决定故事。
              <br />
              表达优化也不应改变因果、人物关系与章尾钩子。
            </p>
          </div>
        </section>
      )}
    </>
  );
}
