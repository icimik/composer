import { useState } from 'react';
import type { RevisionPreview } from '../types';
import type { ComposerController } from '../composer/useComposer';
import { bridge } from '../composer/shared';
import { useTransition } from '../composer/useTransition';

export function RevisionRecovery({ c, wid }: { c: ComposerController; wid: string }) {
  const [preview, setPreview] = useState<RevisionPreview>();
  const [confirmed, setConfirmed] = useState(false);
  const transition = useTransition(c, c.flush);
  const blocked = c.transitioning || c.busy;
  const inspect = () =>
    transition(async () => {
      setPreview(undefined);
      setConfirmed(false);
      setPreview(await bridge.revisionPreview(wid));
    }, false);
  const apply = () =>
    transition(async () => {
      if (!preview || !confirmed || preview.action === 'conflict')
        throw Error('尚未确认可验证的操作。');
      await bridge.applyRevision(wid, preview.operationId);
      setPreview(undefined);
      setConfirmed(false);
      c.refresh(await bridge.load());
      c.setNotice('修订处理已结束，编辑区未替换。请明确重新打开工作区。');
    }, false);
  const committed = preview?.action === 'roll-forward';
  const phases: Record<string, string> = {
    prepared: '准备完成（未提交）',
    committed: '已决定提交',
    complete: '已完成、待清理',
    retired: '清理中'
  };
  return (
    <div className="health-actions" aria-label="修订恢复">
      <p>处理完成前请保留原目录，不要用旧版本打开。检查和重试不会自动恢复或清空编辑区。</p>
      <button disabled={blocked} onClick={() => void c.run(inspect)}>
        检查修订记录
      </button>
      {preview && (
        <div>
          <p>
            文档：{preview.title}；操作 ID：{preview.operationId}；阶段：
            {phases[preview.phase] || '无法判定'}
          </p>
          {preview.action === 'conflict' ? (
            <p role="status">文件与修订镜像冲突，不能自动覆盖。请保留现场。</p>
          ) : (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={blocked}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                {committed ? '我确认完成已提交的修订' : '我确认清理已验证的暂存记录'}
              </label>
              <button disabled={blocked || !confirmed} onClick={() => void c.run(apply)}>
                {committed ? '完成已提交的修订' : '清理已验证的暂存记录'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
