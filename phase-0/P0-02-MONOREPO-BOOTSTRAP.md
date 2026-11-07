# P0-02 — Greenfield Monorepo Bootstrap

**优先级**：P0  
**估算**：0.5–1 工程日  
**依赖**：P0-01  
**可并行**：否（根配置独占）

## 1. 目标

当前项目是全新的 Greenfield 项目。

不存在旧业务代码迁移，也不需要克隆 `agent-autoloop` 作为产品代码仓库。

P0-02 必须直接建立 D-021 规定的 pnpm Monorepo 工程基线。

## 2. 前置条件

执行 AI 必须具备：

- 真实目标 Git 仓库读写能力；
- 实际 Shell/终端执行能力；
- Git；
- Node.js；
- pnpm（已存在或按项目规则启用）。

如果不满足，不得修改工程并声称完成。

## 3. 执行前检查

### 3.1 确认仓库

```bash
git rev-parse --show-toplevel
```

### 3.2 确认当前分支

优先：

```bash
git branch --show-current
```

旧 Git：

```bash
git symbolic-ref --short HEAD
```

### 3.3 最新提交

```bash
git log -1 --oneline
```

### 3.4 工作区

```bash
git status --short
```

要求：

- 输出为空：可以继续；
- 存在未提交修改：停止并报告；
- 不得自行使用 `git reset --hard` 或 `git clean -fd` 清理。

## 4. 必须保留

不得删除、覆盖或擅自改写：

- `AGENTS.md`
- Sprint 文档
- `DECISIONS.md`
- `SPRINT_PLAN.md`
- `ACCEPTANCE_MATRIX.md`
- P0-01 基线文档

## 5. 必须建立的 Monorepo

```text
apps/
├── workbench/
├── api/
└── worker/

packages/
├── database/
├── contracts/
├── shared/
└── config/
```

同时建立：

```text
package.json
pnpm-workspace.yaml
pnpm-lock.yaml
.npmrc
```

建议建立：

```text
.node-version
```

并保留：

```text
docs/
infra/
```

## 6. D-021 包名

必须严格使用：

```text
@workspace/workbench
@workspace/api
@workspace/worker

@workspace/database
@workspace/contracts
@workspace/shared
@workspace/config
```

不得自行变更。

## 7. 当前阶段边界

只建立最小工程骨架。

不得提前实现：

- 用户认证；
- 用户/Workspace/Project 数据模型；
- 项目 CRUD；
- AI Agent；
- Shopify；
- Storefront；
- 工作流；
- 审批；
- 业务 API。

## 8. 依赖版本规则

必须：

1. 固定 Node.js 版本；
2. 固定 pnpm 版本；
3. 根 `package.json` 明确 `packageManager`；
4. `.npmrc` 设置：

```ini
save-exact=true
```

5. 所有直接依赖使用明确版本；
6. 不使用：

```text
*
latest
^
~
```

作为直接依赖版本范围；
7. 生成并提交 `pnpm-lock.yaml`。

不得手工伪造 lockfile。

## 9. 最小入口

每个 workspace 必须有：

- 明确 package name；
- 合理的 scripts；
- 最小入口或可验证模块。

不要求在 P0-02 完成完整 Web/API/Worker 功能。

## 10. 验收命令

根据实际环境执行：

```bash
git status --short

node --version
pnpm --version

pnpm install --frozen-lockfile
pnpm -r list --depth 0
```

然后执行仓库定义的最小验证。

如果 P0-02 已定义：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

则实际执行并记录结果。

如果这些脚本属于 P0-03 才建立，则明确标记：

```text
NOT APPLICABLE — deferred to P0-03
```

不得伪造 PASS。

## 11. 完成后验证

必须确认：

```text
apps/workbench
apps/api
apps/worker

packages/database
packages/contracts
packages/shared
packages/config
```

全部存在。

确认：

- workspace 被 pnpm 识别；
- 包名符合 D-021；
- lockfile 已生成；
- 现有 Sprint 文档仍存在；
- Git diff 中没有非必要删除。

再次执行：

```bash
git status --short
```

记录 P0-02 完成后的真实状态。

## 12. 输出报告

必须包含：

### 实际环境
- OS；
- Git；
- Node.js；
- pnpm；
- Docker（如可用）。

### Git 基线
- 仓库路径；
- 当前分支；
- P0-02 开始前最新提交；
- 开始前工作区状态；
- 完成后工作区状态。

### 工程结果
- 最终目录树；
- Workspace 列表；
- Package Name 列表；
- 固定版本方式；
- `.npmrc` 配置；
- lockfile 验证结果。

### 验证
逐条列出：

```text
命令 | 实际结果 | PASS / FAIL / NOT APPLICABLE
```

### 修改文件
列出全部新增/修改文件。

### 风险
不得隐藏环境兼容问题或未完成事项。

## 13. 完成后停止

P0-02 完成后：

> 不得自行进入 P0-03。

等待主控审核。
