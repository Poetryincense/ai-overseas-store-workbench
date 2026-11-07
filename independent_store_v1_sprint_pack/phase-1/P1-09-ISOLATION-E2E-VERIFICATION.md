# P1-09 — Multi-Project Isolation & E2E Verification

**优先级**：P0（G1 阻断项）  
**估算**：1 工程日  
**依赖**：P1-07、P1-08  
**可并行**：否（集成验收）

## 1. 目标

用自动化测试证明多个项目能在同一工作台运行，且不同 Workspace/用户的数据不会交叉。验证关键端到端路径。

## 2. 输入文件（先读）

- Auth、Workspace Scope、Project API、Dashboard API
- Project 页面、Dashboard 页面
- 所有 unit/integration/e2e tests
- Test DB 工厂和 Playwright 配置

## 3. 修改范围

新增或完善：
- 根脚本 `test:integration`，统一运行各服务集成测试；
- 根脚本 `test:e2e`，运行 Workbench Playwright E2E；
- 两个测试 User/Workspace 的隔离测试 Fixture；
- Project A、Project B 的多项目 E2E；
- 跨 Workspace 越权读取/更新测试；
- 客户端伪造 workspaceId 测试；
- 归档/恢复和 Dashboard 一致性测试；
- README 中自动化测试说明。

关键安全场景：
1. 用户 A 创建 Project A；用户 B 创建 Project B。
2. A 使用 B 的 projectId 请求详情、PATCH、archive，全部统一 404。
3. A 在请求 body 中注入 B 的 workspaceId，服务端仍使用 A 的 Workspace。
4. A 的 Dashboard/list 不包含 B 的项目。
5. 用户登出或 Session 撤销后不能读取项目数据。

## 4. 禁止事项

- 不得通过 mock scope guard 让隔离测试“通过”。
- 不得只测前端隐藏，不测后端 API。
- 不得使用生产数据库或真实店铺账号。
- 不得把安全测试标为 skip。
- 不得用同一个 Workspace 下的两个项目冒充跨 Workspace 安全测试；两者都要测。

## 5. 实施步骤

1. 建立隔离测试数据工厂。
2. 编写 API integration security tests。
3. 编写 Browser E2E 主链路。
4. 运行全量质量检查和 Migration deploy 测试。
5. 输出测试覆盖和残余风险报告。

## 6. 验收标准

- [ ] 同一 Workspace 的多个项目可分别创建、访问和编辑。
- [ ] A/B 项目资料不串。
- [ ] 跨 Workspace API 操作一律失败且不泄漏存在性。
- [ ] Dashboard/list 数据范围正确。
- [ ] Session 失效后数据访问失败。
- [ ] 所有安全测试真实运行，未被 skip。
- [ ] 从空 DB Migration 后端到端流程通过。

## 7. 验收命令

```bash
pnpm db:migrate:deploy
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```

## 8. 手工验证步骤

1. 登录用户 A，创建两个不同类型项目。
2. 登录独立测试用户 B，创建第三个项目。
3. 用 A 的 Cookie 访问 B 项目 API，确认 404。
4. 用 B 的 Cookie 登录 UI，确认只看到 B 的项目。
5. 检查 DB 中所有 Project 均有 workspace_id。

## 9. 输出

自动化隔离测试、端到端测试、覆盖报告和残余风险报告。
