# P1-01 — Identity, Workspace & Project Schema

**优先级**：P0（Phase 1 阻断项）  
**估算**：0.5–1 工程日  
**依赖**：G0 通过  
**可并行**：否（Schema/Migration 独占）

## 1. 目标

建立 Phase 1 的最小正式数据模型和可重复 Migration：User、Workspace、WorkspaceMember、Session、Project、ProjectProfile。只建立实际会使用的字段，不提前生成 Agent、Workflow、Artifact、Store 等未来表。

## 2. 输入文件（先读）

- `AGENTS.md`、`DECISIONS.md`、`SPRINT_PLAN.md`
- `packages/database/`、ORM 配置和现有 migrations
- `.env.example`、DB health/runbook
- `docs/sprints/phase-0/BASELINE_AUDIT.md`

## 3. 修改范围

新仓库用 Prisma（已有成熟 ORM 则沿用）创建 Schema 和 Migration。

至少实现 `DECISIONS.md` 中定义的 6 张表及约束：
- 用户 email 规范化唯一；
- Workspace slug 唯一；
- WorkspaceMember 外键及 `(workspace_id,user_id)` 唯一；V1 限制每用户一个 Workspace；
- Session 仅保存 Token hash；
- Project `(workspace_id,slug)` 唯一；
- ProjectProfile 与 Project 一对一；
- 项目类型、项目状态使用枚举或等效约束；
- 时间字段统一 UTC 存储；
- 预算用 Decimal，不用浮点数。

提供：
- DB client 导出；
- Migration；
- `db:generate`、`db:migrate:dev`、`db:migrate:deploy`、`db:migrate:status`、`db:studio` 等脚本；
- 不含真实业务数据的测试 seed（Owner 初始化另由 P1-02 实现）。
- 根目录命令别名：`db:generate`、`db:migrate:dev`、`db:migrate:deploy`、`db:migrate:status`、`db:studio`，统一转发到 `@workspace/database`。

## 4. 禁止事项

- 不得创建 Agent、Task、Artifact、Shopify、Metric 等尚未进入 Phase 1 的表。
- 不得用 `db push` 作为部署方案。
- 不得以 `workspace_id` 可空来规避数据归属。
- 不得给预算字段使用 Float/Double。
- 不得保存原始 Session Token。
- 不得在 Migration 中写入固定用户密码或生产数据。

## 5. 实施步骤

1. 检查 ORM 与数据库现状；必要时先提出 ADR。
2. 定义 Schema、枚举、关系、索引和删除策略。
3. 从空数据库创建 Migration。
4. 使用 Migration 将本地数据库升级到最新。
5. 运行 Schema/Repository 基础测试。
6. 记录 Migration 名称和回滚/恢复策略。

## 6. 验收标准

- [ ] 六张表与关键字段符合 `DECISIONS.md`。
- [ ] 所有核心外键和唯一约束有效。
- [ ] 从空数据库可使用 Migration 建库。
- [ ] 第二次执行 Migration 不会重复建表或破坏数据。
- [ ] ORM Client 生成成功。
- [ ] 测试覆盖唯一约束、外键和 Profile 一对一关系。

## 7. 验收命令

```bash
pnpm db:generate
pnpm db:migrate:status
pnpm db:migrate:deploy
pnpm --filter @workspace/database test
pnpm typecheck
```

若包名或命令已在审计报告中映射，执行等价脚本并更新本文档。

## 8. 手工验证步骤

1. 使用独立测试数据库验证空库 Migration。
2. 尝试重复 email、重复 workspace slug、重复项目 slug，确认约束拒绝。
3. 尝试为一个 Project 创建第二条 Profile，确认拒绝。
4. 检查数据库中没有明文 Session Token 或凭据。

## 9. 输出

Schema、Migration、DB Client、脚本、数据库模型说明。
