# 源码导入与复测记录

本记录补充原始 `verification-results.md`，不覆盖原开发任务的历史记录。导入日期为 2026-10-09（UTC）；作者当地日期为 2026-10-08。

## 来源与版本

- 目标仓库：[icimik/composer](https://github.com/icimik/composer)，基于初始提交 `ed76b7e`。
- 来源为作者邮件附件 `Icimik-Composer-0.1.0-source.zip`，不是重新生成的实现。
- ZIP SHA-256：`6068993e35341534aa96ada8a8b90a47fd8e384f92f8ccc72bfd348e40f6e562`。
- 独立分支：`feat/novel-workbench`；原样导入提交：`b57e543`。
- 提交前逐文件比较确认源码树与解压附件一致；复测生成的截图已恢复为附件原始版本。依赖、lockfile、应用代码、测试与 CI 配置没有修改。
- 本次只额外添加这份记录，说明恢复来源与实际复测结果。

## 本次实际执行

环境为 Linux 容器、Node 22.23.3、Xvfb。安装依赖使用附件 lockfile；没有使用真实稿件、真实模型密钥或付费模型服务。

| 命令 | 结果 |
|---|---|
| `npm ci --no-audit --no-fund` | 成功 |
| `npm run check` | 成功：TypeScript、Vite 构建，25/25 单元测试 |
| `npm run design:check`（包含于 check） | 76/76 对比度配对通过，3 个故意篡改反例被拒绝 |
| `xvfb-run -a npm run test:e2e` | 22/22 真实 Electron E2E 通过，40.2 秒 |
| `git diff --cached --check` | 原样导入提交通过 |

首次 E2E 未启动成功，原因是容器缺少 `libgtk-3.so.0`。安装系统 GTK 运行库后，未修改应用代码，完整重跑 22 项全部通过。这次环境准备不是产品修复。

AI 测试使用本地 mock Chat Completions 服务。原生文件选择框使用路径 fixture；测试后的实际文件读写与 Electron 窗口操作是真实执行。

## 交付状态与限制

本次已确认连接具有目标仓库推送权限，将通过独立分支和 PR 交付，不直接合并到 `main`。原 `verification-results.md` 中“没有写权限、未推送”的描述是原任务当时的状态，不代表本次授权后的状态；最终推送、PR 和 CI 状态以 GitHub 页面为准。

- macOS／Windows 验证由随附 GitHub Actions workflow 执行；本地 Linux 成功不能当作双平台验收。
- 未进行真实模型文学质量、OS 凭据权限、安装卸载、正式签名、公证或自动更新验收。
- 未在本轮重新执行依赖安全审计；原报告中的审计数值是原开发任务的历史结果。
- 不修改原版本声明的已知限制，也不把开发安装包称为正式发行。
