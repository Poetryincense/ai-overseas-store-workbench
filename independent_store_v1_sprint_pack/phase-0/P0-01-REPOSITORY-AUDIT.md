# P0-01 — Repository Audit & Baseline

**优先级**：P0（阻断后续任务）  
**估算**：0.5–1 工程日  
**依赖**：无  
**可并行**：否

## 1. 目标

摸清目标仓库当前状态，形成真实的架构/代码/运行环境基线，避免 AI 编码团队误把已有项目当新项目重建。该任务只做审计和文档，默认不修改业务代码。

## 2. 输入文件（先读）

- `AGENTS.md`（若尚不存在，先读取启动包内版本，不要立即覆盖仓库中的现有规则）
- `package.json`、lockfile、workspace 配置（存在时）
- `tsconfig*`、lint/format/test 配置
- `apps/`、`packages/`、`src/`、`prisma/` 或现有等价目录
- `docker-compose*`、`.env.example`、CI Workflow
- `README*`、`docs/`、现有 ADR
- `git status --short`、`git log -5 --oneline`

## 3. 修改范围

仅新增/更新：
- `docs/sprints/phase-0/BASELINE_AUDIT.md`
- `docs/adr/ADR-0001-phase0-1-baseline.md`（只有需要记录确认后的决策时）

审计报告必须覆盖：仓库树、当前框架、Node/包管理器、服务入口、数据库/ORM、认证、测试、CI、本地启动方式、现存未提交变更、可复用模块、缺口、风险和建议路径映射。

对每项建议标注：`EXISTS`、`PARTIAL`、`MISSING`、`RISK`。不得假设文件存在或命令成功。

## 4. 禁止事项

- 不得删除、移动或批量格式化代码。
- 不得重新初始化仓库或覆盖 lockfile。
- 不得升级依赖或重写配置。
- 不得把“符合任务包示例目录”作为重构理由。
- 不得在审计报告中声称运行过未实际运行的命令。

## 5. 实施步骤

1. 执行 `git status --short`、`git log -5 --oneline`、`find . -maxdepth 3 -type f`（按环境调整）。
2. 读取根配置和关键应用入口。
3. 探测 Node、包管理器、数据库和 Docker 版本/可用性。
4. 尝试运行当前仓库已有的 lint/typecheck/test/build 命令；不存在的命令标记 MISSING。
5. 与 `DECISIONS.md` 对照，输出沿用、适配或需要 ADR 的项目。
6. 给出 Phase 0 后续任务的实际文件路径映射和风险。

## 6. 验收标准

- [ ] 报告基于真实仓库，不使用推测补齐事实。
- [ ] 有仓库结构和现有技术栈说明。
- [ ] 记录所有已有脚本及实际执行结果。
- [ ] 标出与启动包决策不一致的地方及影响。
- [ ] 给出 `P0-02` 至 `P0-06` 的路径映射和复用建议。
- [ ] 本任务没有产生非文档代码改动。

## 7. 验收命令

```bash
git status --short
git diff --stat
test -f docs/sprints/phase-0/BASELINE_AUDIT.md
```

如果有意外代码改动，必须解释并还原与本任务无关的修改（不得触碰用户原有未提交改动）。

## 8. 手工验证步骤

1. 负责人核对报告中框架、目录、脚本、服务和数据库描述。
2. 负责人决定采用现有技术栈还是按新仓库基线创建。
3. 负责人批准后才派发 P0-02。

## 9. 输出

`BASELINE_AUDIT.md`、建议路径映射、风险清单，以及明确的 `P0-02` 执行建议。
