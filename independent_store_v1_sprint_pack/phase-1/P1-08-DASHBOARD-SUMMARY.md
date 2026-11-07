# P1-08 — Dashboard Summary API & UI

**优先级**：P1  
**估算**：0.5–1 工程日  
**依赖**：P1-06  
**可并行**：API 可并行开发；UI 必须协调 Workbench Layout 修改

## 1. 目标

实现个人工作台 Dashboard，展示当前 Workspace 的真实项目概览，不提前展示尚不存在的任务、订单、销售和 AI 执行统计。

## 2. 输入文件（先读）

- Project Repository/API
- Workspace Context
- Workbench Dashboard Page/Layout
- 统一 API 契约

## 3. 修改范围

API：
- `GET /api/v1/dashboard/summary`
- 返回 `totalProjects`、`draftProjects`、`activeProjects`、`pausedProjects`、`archivedProjects`、`recentProjects`。
- 所有统计都按服务端当前 Workspace 聚合。
- recentProjects 最多 5 条，字段仅包含 id/name/type/status/updatedAt。

UI：
- 项目总数与状态卡片；
- 最近项目列表；
- 创建项目入口；
- 第一次使用时的欢迎/空状态。

## 4. 禁止事项

- 不得展示硬编码 12 个项目、虚构销售额、虚构任务数或虚构最近活动。
- 不得把不存在的数据字段以 0 伪装为已经接入的业务数据；仅项目统计可以真实为 0。
- 不得在前端自行跨项目聚合。
- 不得创建通用 BI 或自定义 Dashboard 编辑器。

## 5. 实施步骤

1. 在 API Service 中实现 Workspace-scoped aggregate query。
2. 定义并验证 Dashboard DTO。
3. 更新 `/dashboard` 页面消费 API。
4. 增加 DB aggregate 集成测试和 UI E2E。

## 6. 验收标准

- [ ] Dashboard 统计与项目列表数据一致。
- [ ] 仅聚合当前 Workspace 项目。
- [ ] 没有项目时各项目统计为真实 0，并显示空状态。
- [ ] 创建、归档和恢复项目后统计更新。
- [ ] API 未登录时返回 401。
- [ ] UI 不显示无数据来源的业务指标。

## 7. 验收命令

```bash
pnpm --filter @workspace/api test:integration -- dashboard
pnpm --filter @workspace/workbench test
pnpm test:e2e -- dashboard.spec.ts
pnpm lint && pnpm typecheck && pnpm build
```

## 8. 手工验证步骤

1. 创建两个项目，确认 Dashboard 总数为 2。
2. 激活一个、暂停一个，核对状态统计。
3. 归档一个，核对 archived 数量。
4. 换测试用户/Workspace，确认统计不会包含前一 Workspace 的项目。

## 9. 输出

Dashboard Summary API、页面、集成和 E2E 测试。
