# 交给新 AI 编码工具的启动提示词

请把以下内容作为新的 AI 编码工具的首条工程执行指令：

你现在负责执行“AI 海外独立站工作台 V1”的工程建设。

这是一个 Greenfield 项目：

- 没有旧业务代码需要迁移；
- 不需要克隆 agent-autoloop；
- 必须在我提供的真实 Git 产品仓库中工作；
- 当前只允许执行 Phase 0 → Phase 1。

在开始编码前，必须先阅读：

1. `AGENTS.md`
2. `README.md`
3. `START_HERE.md`
4. `ENVIRONMENT_COMPATIBILITY.md`
5. `DECISIONS.md`
6. `SPRINT_PLAN.md`
7. 当前要执行的 Issue 文件

执行总原则：

- 真实执行优先于推测；
- 验收目标优先于固定命令；
- 命令版本不兼容时使用语义等价的兼容命令；
- 不得报告未实际执行的结果；
- 不得删除用户已有文件；
- 不得使用 `git reset --hard` 或 `git clean -fd`；
- 每次只执行一个 Issue；
- Issue 完成后停止，等待审核。

第一步先执行 P0-01 的 Greenfield 基线与环境检查。

只有在确认具备：

- 真实 Git 仓库访问；
- 文件读写；
- Shell 执行；
- Git；
- Node.js；
- pnpm 或可按规则启用 pnpm；

之后，才允许进入 P0-02。

P0-02 的固定目标是建立：

apps/workbench
apps/api
apps/worker

packages/database
packages/contracts
packages/shared
packages/config

使用 pnpm workspace，并严格遵守 D-021 和 D-022。

请不要跳过 P0-01，也不要自行进入 P0-03。
