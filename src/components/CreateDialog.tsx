import type { ReadyComposer } from '../composer/useComposer';
import { kinds } from '../composer/shared';

import type { Kind } from '../types';
export function CreateDialog({ c }: { c: ReadyComposer }) {
  const { dialog, name, setName, newKind, setNewKind, key, run, create } = c;
  return (
    <>
      {['workspace', 'document', 'session'].includes(dialog) && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(create);
          }}
        >
          <p className="dialog-description">
            {dialog === 'workspace'
              ? '每个工作区有独立的作品资料、会话、提案和模型设置。'
              : dialog === 'session'
                ? '会话保留打开的文档、创作指令和提案；正文仍是同一份，不产生并行稿。'
                : '文档将以 Markdown 保存在当前工作区。'}
          </p>
          <label className="field">
            名称
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
            />
          </label>
          {dialog === 'document' && (
            <label className="field">
              文档类型
              <select value={newKind} onChange={(e) => setNewKind(e.target.value as Kind)}>
                {kinds.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button className="primary-button" type="submit" disabled={!name.trim()}>
            创建
          </button>
        </form>
      )}
    </>
  );
}
