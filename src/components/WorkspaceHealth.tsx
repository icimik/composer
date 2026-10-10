import { useState } from 'react';
import type { ComposerController } from '../composer/useComposer';
import { RevisionRecovery } from './RevisionRecovery';

export function WorkspaceHealth({ c }: { c: ComposerController }) {
  const [name, setName] = useState('');
  const faults = c.state?.workspaces.filter((w) => w.status === 'unavailable') || [];
  return (
    <section className="workspace-health" aria-label="工作区诊断">
      <div className="health-actions">
        <span>{faults.length ? `${faults.length} 个工作区无法打开` : '本地工作区'}</span>
        <button disabled={c.transitioning || c.busy} onClick={() => void c.run(c.retry)}>
          重试加载工作区
        </button>
        {c.w && !c.available && (
          <>
            <span role="status">当前编辑区已保留，只读。修复后请重新打开。</span>
            <button
              disabled={c.transitioning}
              onClick={() => void c.run(() => c.switchTo(c.w!.id))}
            >
              重新打开当前工作区
            </button>
          </>
        )}
      </div>
      {faults.length > 0 && (
        <ul>
          {faults.map(
            (w) =>
              w.status === 'unavailable' && (
                <li key={w.id} data-testid="workspace-fault">
                  <strong>{w.name}</strong> <span>（ID {w.id}）</span>
                  <p>
                    {w.diagnostic.message} {w.diagnostic.nextStep}
                  </p>
                  {w.diagnostic.code === 'revision-recovery-required' && (
                    <RevisionRecovery c={c} wid={w.id} />
                  )}
                </li>
              )
          )}
        </ul>
      )}
      {!c.w && (
        <>
          <p>
            {c.state?.workspaces.some((w) => w.status === 'ready')
              ? '请选择可读取的工作区；不可读取的作品不会作为空稿打开。'
              : '没有可读取的工作区。请保留原文件，外部修复后重试。'}
          </p>
          <div className="health-actions">
            {c.state?.workspaces
              .filter((w) => w.status === 'ready')
              .map((w) => (
                <button
                  key={w.id}
                  disabled={c.transitioning}
                  onClick={() => void c.run(() => c.switchTo(w.id))}
                >
                  打开 {w.name}（{w.id}）
                </button>
              ))}
            <button disabled={c.transitioning} onClick={() => void c.run(c.openWorkspace)}>
              打开目录
            </button>
          </div>
          <details>
            <summary>新建工作区</summary>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void c.run(() => c.newWorkspace(name));
              }}
            >
              <label>
                新工作区名称
                <input
                  value={name}
                  maxLength={120}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <button disabled={c.transitioning || !name.trim()}>创建新工作区</button>
            </form>
          </details>
        </>
      )}
    </section>
  );
}
