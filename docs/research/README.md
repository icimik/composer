# Icimik Composer 研究档案

研究日期：2026-10-09。该目录同时保存外部证据与产品判断，二者分开标注；功能实现状态以代码、测试结果与验证记录为准。

## 阅读顺序

- **01 调研报告**：研究问题、方法、核心判断与限制。
- **02 竞品细节**：每个工具的官方证据、适用工作流和不采用的设计。
- **03 框架映射**：框架与 UI／AI／存储功能之间的对应及未实现部分。
- **04 产品规格**：首期功能、workspace／session 语义、关键用户旅程和验收。
- **05 架构与安全**：Electron 边界、文件格式、AI 数据流和风险。
- **06 路线图**：小说先行，IF 与视觉小说后续选配，不承诺未评估日期。
- **07 验证计划与记录**：QA 清单、真实执行结果和平台验收边界。
- **08 设计规范**：由实际 token 源自动生成的目标规范。
- **[09 后续设计与竞品调研](09-后续设计与竞品调研.md)**：12 个工具的官方证据、小说／IF／Text Adventure／VN 的设计取舍，以及 24 个 GitHub issues 的完整索引。
- **[最新验证记录](current-verification.md)**：修复、当前 CI 证据和新的 artifact 策略；原始 [verification-results](verification-results.md) 与 [导入记录](import-verification.md)作为带版本的历史保留。
- **[TypeScript／Vite 升级评估](toolchain-upgrade.md)**：保留候选阶段的兼容矩阵与独立试验。PR #39 已合并，实际 main 验证见[工作区任务恢复记录](workspace-isolation-reproduction.md)；TS7 仍是独立议题。
- **[Oxlint／TypeScript 7 候选](oxlint-verification.md)**：#44 跟踪完整 ESLint 替换、规则差异补齐、编译验证与 lint 测速；不是已合并或原生验收声明。
- **[已批准的 CJS／类型检查增强](oxlint-enhancements.md)**：#45 当前增强配置、Promise 修复和更严格编译门禁；初始 15.3 倍测速不代表增强后结果。
- **[合并后交接与原生阻塞](oxlint-merge-handoff.md)**：#45 已合并，#31 被 Dependabot 自动关闭；macOS fixture 路径问题由 #46 跟踪，不能提前宣称原生验收完成。
- **[工作区损坏隔离复现](workspace-isolation-reproduction.md)**：保留 #40 设计阶段的合成 Store／真实 Linux Electron 故障证据；原先待批状态已由设计批准和后续实现取代，不是当前验收结果。
- **[工作区损坏隔离实现验证](workspace-isolation-verification.md)**：PR #41 已经独立批准、合并并回读 main 验收，#40 已关闭；保留逐 head 的历史证据，#4 其余范围仍开放。
- **[单文档修订中断复现](document-revision-reproduction.md)**：#42 的五个临时中断 probe；核心契约已批准、资源配置已按授权选择，安全清理和产品恢复接线仍未完成。
- **[修订镜像资源配置](revision-resource-allocation.md)**：500 万／3500 万字章节化样本、历史增长和实测规划内存／耗时；按授权选择 256 MiB 暂存与 256 MiB 额外余量，不承诺无限历史。
- **设计展示页**：`design-showcase.html`，单文件离线打开，支持明暗模式、布局密度、状态交互和对比度表。

根目录 `README.md` 提供运行方法；本目录的 HTML 是设计证据，不是桌面应用。旧讨论稿中的 Tauri、IF 与小说同时交付等建议已被最新需求替代。

开发推进使用 [AGENTS](../../AGENTS.md)、[loop 流程](../development/loop.md)与 [ADR 目录](../decisions/)；总览 issue 为 [composer#2](https://github.com/icimik/composer/issues/2)，功能与框架议题以 09 文档中的引用为入口。优先级是设计建议，不是未经确认的排期。
