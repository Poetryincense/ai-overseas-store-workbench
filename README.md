# AI 海外独立站工作台 V1 — AI 可执行工程启动包

**版本**：V1.1（Greenfield + 环境兼容修订版）  
**适用对象**：具备实际 Git 仓库读写能力和 Shell/终端执行能力的 AI 编码工具  
**当前范围**：Phase 0 → Phase 1  
**项目类型**：Greenfield（新项目，无旧业务代码迁移）

## 1. 本包解决什么问题

本包用于把“AI 海外独立站工作台 V1”交给新的 AI 编码工具执行。

它不是前端 Demo 提示词，而是一套工程实施基线，要求 AI：

- 在真实 Git 仓库中工作；
- 实际读取文件和执行命令；
- 实际修改代码；
- 实际生成 lockfile、Migration、测试；
- 实际运行验收命令；
- 不得把推测、模拟或理论结果报告为执行结果。

## 2. 当前项目状态

本项目是全新的 Greenfield 项目：

- 不存在旧业务代码迁移；
- 不需要克隆 `agent-autoloop` 作为产品代码；
- `agent-autoloop` 仅可作为后续技术研究参考；
- 产品仓库应从本工程基线开始建立自己的 Monorepo。

目标代码仓库必须由执行 AI 实际访问。

## 3. 开始前必须确认的能力

新的 AI 工具必须具备：

1. 可访问目标 Git 仓库；
2. 可读取和修改仓库文件；
3. 可执行 Shell/终端命令；
4. 可执行 Node.js / pnpm；
5. 最好可运行 Docker Compose；
6. 可查看命令真实输出。

如果缺少第 1～4 项中的任何一项：

> 不得声称完成 P0-02 及之后的工程任务。

此时只能进行文档审阅、方案修改或代码草稿生成，不能标记工程任务 DONE。

## 4. 首次执行顺序

### Step A：复制本包到目标仓库

至少保留：

- `AGENTS.md`
- `DECISIONS.md`
- `SPRINT_PLAN.md`
- `ACCEPTANCE_MATRIX.md`
- `phase-0/`
- `phase-1/`
- `templates/`

建议放入：

```text
docs/sprints/
```

仓库根目录必须放置：

```text
AGENTS.md
```

### Step B：阅读 START_HERE.md

由主控 AI 先完成环境能力检查。

### Step C：执行 P0-01 状态复核

本包已明确项目为 Greenfield，但新的执行环境仍必须实际确认：

- 仓库路径；
- 当前分支；
- 最新提交；
- 工作区状态；
- Git/Node/pnpm/Docker 可用性。

### Step D：执行 P0-02

只有当目标 AI 具备实际 Shell 和仓库写入能力时，才能建立 Monorepo。

### Step E：严格按依赖继续

```text
P0-01 / Baseline Recheck
        ↓
P0-02 Monorepo Bootstrap
        ↓
P0-03 / P0-04 / P0-05
        ↓
P0-06 Gate G0
        ↓
Phase 1
```

## 5. 命令兼容原则

任务文件中的命令表达的是**验证目标**，不是唯一命令。

例如：

- 新 Git 可用 `git branch --show-current`；
- 旧 Git 可使用 `git symbolic-ref --short HEAD`；
- 某些 Shell 没有 `find` 时，可以使用等价目录列举命令。

但替代命令必须证明同一个验收目标，并在报告中记录。

## 6. 当前阶段明确不建设

Phase 0～1 不建设：

- Agent Runtime；
- 市场研究；
- Shopify；
- Storefront；
- 审批中心；
- 定时运营；
- SaaS 多租户；
- 真实商业运营功能。

不要为了“看起来完整”提前创建空壳业务模块。

## 7. 完成报告原则

每个 Issue 只能报告：

- 实际读取到的文件；
- 实际修改的文件；
- 实际执行的命令；
- 实际得到的结果。

禁止使用：

- “理论上应通过”；
- “预计可运行”；
- “未执行但判断没有问题”；

来替代真实验收。

详见 `START_HERE.md`、`ENVIRONMENT_COMPATIBILITY.md` 和 `AGENTS.md`。
