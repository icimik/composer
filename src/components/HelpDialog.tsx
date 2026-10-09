import type { ReadyComposer } from '../composer/useComposer';

export function HelpDialog({ c }: { c: ReadyComposer }) {
  const { dialog } = c;
  return (
    <>
      {dialog === 'help' && (
        <div className="help-copy">
          <p>工作区隔离不同作品。会话保存你的文档位置、指令和提案，不复制正文。</p>
          <p>
            正文会自动保存，也可以用 ⌘ / Ctrl S 手动保存。F8 进入专注模式，Escape 退出，⌘ / Ctrl K
            打开快速操作。
          </p>
          <p>
            AI
            支持空章生成、续写和整章表达优化。先在模型设置中配置服务，再确认发送范围。提案可以采纳或放弃；正文变化后，旧提案会拒绝覆盖。
          </p>
          <p>
            阶段检查是作者记录，不代表自动完成框架的多角色验收。交互小说和视觉小说在后续路线图中，首版仅支持小说。
          </p>
          <p className="privacy-note">
            首次开发版本：请保留作品备份。暂不支持多人并行编辑、外部实时文件监听或云端同步。
          </p>
        </div>
      )}
    </>
  );
}
