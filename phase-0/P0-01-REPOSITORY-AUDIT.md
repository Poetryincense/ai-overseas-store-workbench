# P0-01 — Greenfield Repository Baseline & Environment Check

**优先级**：P0  
**估算**：0.5 工程日  
**依赖**：无  
**可并行**：否

## 1. 目标

本项目是 Greenfield 项目。

P0-01 不负责寻找旧业务代码或迁移现有系统，而是：

1. 确认目标 Git 仓库可访问；
2. 确认当前 Git 基线；
3. 确认工作区状态；
4. 确认实际执行环境能力；
5. 确认 Sprint 文档完整；
6. 为 P0-02 建立真实的工程起点。

## 2. 输入文件

必须先读取：

- `AGENTS.md`
- `README.md`
- `DECISIONS.md`
- `SPRINT_PLAN.md`
- `ENVIRONMENT_COMPATIBILITY.md`
- 当前仓库已有 Sprint 文档

## 3. 修改范围

默认只允许新增或更新：

```text
docs/sprints/phase-0/BASELINE_AUDIT.md
```

不得修改业务代码。

## 4. 必须验证

### Git 仓库

```bash
git rev-parse --show-toplevel
git log -1 --oneline
git status --short
```

### 当前分支

优先：

```bash
git branch --show-current
```

不支持时：

```bash
git symbolic-ref --short HEAD
```

### 环境

```bash
git --version
node --version
pnpm --version
docker --version
docker compose version
```

不可用命令必须记录 `UNAVAILABLE`。

## 5. 输出报告必须包含

- 仓库路径；
- 当前分支或 detached HEAD 状态；
- 最新提交；
- 工作区是否干净；
- Git / Node / pnpm / Docker 实际版本；
- 是否具备 Shell；
- 是否具备仓库读写能力；
- 是否可以进入 P0-02；
- Sprint 文档完整性；
- 阻塞项。

## 6. Greenfield 判断

如果没有业务代码，这是预期状态，不是错误。

报告应明确：

```text
Project Type: GREENFIELD
Legacy Code Migration: NOT REQUIRED
Reference Repository Clone: NOT REQUIRED
```

## 7. 验收

- [ ] 所有结论来自实际读取或实际命令输出；
- [ ] 未把 GitHub API 查询伪装成本地 Shell 验证；
- [ ] 未修改无关文件；
- [ ] 明确 P0-02 是否可执行；
- [ ] 未实际进入 P0-02。

## 8. 状态

完成后只能：

- `DONE`：环境足以继续；
- `PARTIAL`：非关键工具缺失，但 P0-02 可继续；
- `BLOCKED`：缺少真实仓库/Shell/Node 等关键能力。

完成后停止，等待审核。
