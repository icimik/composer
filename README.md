# Icimik Composer

面向中文小说作者的本地优先 Electron 创作工作台。当前为 **0.1.0 开发版**，优先小说写作，不包含账号、登录、云端同步或交互小说运行时。

## 本地运行

需要 Node.js 22.12+ 和 npm。macOS、Windows 是目标平台；各提交的实际自动化结果见[最新验证记录](docs/research/current-verification.md)，不要把旧开发记录当作当前 CI 状态。原生人工验收与正式签名仍未完成。

```sh
npm ci
npm run dev
```

`dev` 会先构建渲染器再启动 Electron。修改代码后重新运行；没有引入不必要的在线开发服务。

## 当前功能

- **本地 workspace**：独立文稿、设定、会话、AI 配置与阶段记录，可新建和打开已有目录。
- **创作 session**：独立的文档位置、创作指令和提案；同一作品的正文只有一份。
- **小说工作台**：章节、人物、世界观、大纲、风格规范；中文正文编辑、字数、结构总览、专注模式及明暗主题。
- **可靠保存**：自动保存、关闭前刷新、整篇历史快照、恢复和外部改稿的乐观锁冲突保护。
- **AI 辅助**：OpenAI 兼容 Chat Completions，空章生成、续写、整章表达优化、选定设定上下文、取消、提案采纳／放弃。
- **作者裁决**：AI 不直接覆盖正文；旧提案在正文变化后无法采纳；阶段检查不冒充完整框架验收。
- **导出**：通过本机保存对话框导出按创建顺序排列的章节 Markdown。

`npm run preview` 是临时的浏览器界面预览，不保存到磁盘，也不接收密钥或调用 AI。桌面端才是产品实现。

## AI 配置与隐私

从右侧模型设置填入 API 基础地址、模型 ID 和密钥。产品模式只允许 HTTPS；密钥加密存于应用数据目录，不进入作品目录、不回传渲染器。没有系统安全存储时拒绝保存，不降级为明文。

发送范围在 UI 中明确显示：当前章全文、创作指令、所选设定和框架的中文生成约束。调用你选择的供应商可能产生费用；使用前确认其数据处理政策。当前不是流式生成，超时为 60 秒；真实供应商兼容性和文学质量需用作者自己的服务另行验收。

## 数据位置

默认作品位于 Electron 用户数据目录的 `data/workspaces/<uuid>`。macOS 与 Windows 分别使用平台的应用数据目录；可以通过界面“打开目录”打开其他位置的现有 Composer 工作区。

```text
作品目录/
  .composer/workspace.json      元数据、会话、阶段、提案
  .composer/history/*.json      整篇历史快照
  03-foundation/                世界观、人物
  03-foundation/souls/          人物档案
  04-outline/                  大纲
  05-rules/                    项目风格规范
  07-writing/chapters/*.md      唯一正式正文
  08-operations/logs/changes.jsonl
  10-publication/
  11-quality/
```

文件名用稳定 ID，显示标题在元数据中。当前正文 Markdown 不带自动注入的标题或 frontmatter。字数按非空白 Unicode 码点统计，包括标点；不等于英文词数或供应商 token 数。

## 测试与设计验证

```sh
npm run check
npm run test:smoke
npm run test:e2e
npm run design:build
npm run design:check
```

Linux 运行 Electron E2E 需要 GTK、NSS、音频库及图形环境，可用 `xvfb-run -a npm run test:e2e`。测试只使用临时工作区、进程内加密的测试密钥及本地 mock HTTP 服务，不会消费真实模型额度。产品包中无法开启此测试分支。

`check` 包含 lint、限定范围的格式检查、文档／skill／YAML／CI 策略检查、类型／生产构建、unit 和设计检查。`test:smoke` 验证受污染环境下的真实 Electron 启动；共用 helper 会彻底移除 `ELECTRON_RUN_AS_NODE`，不是设为空值。

## 打包

```sh
npm run dist
```

macOS 上生成 DMG／ZIP，Windows 上生成 NSIS。普通 push／PR 仅使用 Linux 做跨平台源码的构建检查与 Electron E2E，不启动 Windows／macOS runner，不构建安装包、不上传任何 artifact。仅合并到 `main` 后的 push，才在 Linux 验证成功后运行 Windows／macOS 原生检查及构建；全部通过后上传未签名开发安装包，不自动发布 release。详见 [CI 策略](docs/development/ci-policy.md)。

本项目原创代码与文档采用 [MIT](LICENSE)；内置创作框架和选定的上游 skills 保留 CC0-1.0 及完整来源，详见[许可证与来源说明](docs/development/licensing.md)。正式发行仍需完成其他依赖／素材来源审查、图标、macOS 签名／公证、Windows 签名和原生人工验收。

## 研究与路线图

[研究入口](docs/research/README.md)包含证据、竞品分析、框架映射、产品规格、架构、路线图、设计规范、离线展示页及验证记录。[后续调研与 issue 索引](docs/research/09-后续设计与竞品调研.md)把 12 个工具的官方证据映射到 24 个设计议题；IF、世界模拟、视觉小说和 Ren’Py 导出仍是计划，不是已实现功能。

## 参与开发

先读 [CONTRIBUTING](CONTRIBUTING.md) 和 [AGENTS](AGENTS.md)，按 [fresh-context loop](docs/development/loop.md)从 issue、设计、PR、review 到维护者授权 merge 推进。恢复任务时读取 [.agents/workstate.md](.agents/workstate.md)，不要依赖历史聊天；[skills 目录](.agents/skills/README.md)提供精选的项目适配 guidance。

安全问题走 [SECURITY](SECURITY.md)，社区参与遵守 [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md)。变更记录见 [CHANGELOG](CHANGELOG.md)，远端保护与发行前待办见[维护者清单](docs/development/maintainer-setup.md)。
