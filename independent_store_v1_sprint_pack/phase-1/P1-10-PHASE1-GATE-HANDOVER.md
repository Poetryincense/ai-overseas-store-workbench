# P1-10 — Phase 1 Gate & Handover

**优先级**：P0（阶段关口）  
**估算**：0.5 工程日  
**依赖**：P1-09  
**可并行**：否

## 1. 目标

完成 Phase 1 的最终验收、开发文档更新和代码交接，形成进入 Phase 2（Artifact/Workflow/Agent）的可靠基线。

## 2. 输入文件（先读）

- 全部 P0/P1 Issue 完成报告
- `ACCEPTANCE_MATRIX.md`
- `README.md`、runbooks、API 文档、Migration 文档
- CI 运行记录
- `git status --short`、测试报告

## 3. 修改范围

新增：
- `docs/sprints/phase-1/PHASE1_ACCEPTANCE_REPORT.md`
- `docs/architecture/phase1-baseline.md`（如现有架构文档已覆盖则更新）
- 开发、备份、Migration、测试和 Owner 初始化 runbook 更新

报告必须包含：
- 实际完成 Issue 与未完成 Issue；
- 真实测试命令与退出结果；
- Migration 版本；
- API 清单；
- 页面清单；
- 已知缺陷与风险；
- 已作出的 ADR；
- Phase 2 前置建议。

## 4. 禁止事项

- 不得为通过 Gate 临时注释或跳过测试。
- 不得把尚未实现的 Agent/Shopify/Storefront 功能标记完成。
- 不得删除未解决缺陷记录。
- 不得在报告中声称未执行的端到端验收通过。

## 5. 实施步骤

1. 逐条核对 Acceptance Matrix。
2. 执行从空库到应用启动的完整流程。
3. 执行全部 lint/format/typecheck/unit/integration/E2E/build。
4. 检查 Git diff 与工作区状态。
5. 更新 README、runbook、API 文档。
6. 输出 Phase 1 验收报告并明确 Gate 结论：PASS / FAIL / PASS WITH BLOCKERS。

## 6. 验收标准

- [ ] G0 全部通过。
- [ ] G1 全部通过。
- [ ] 所有 Issue 有完成报告。
- [ ] 文档命令与真实脚本一致。
- [ ] 无未说明的数据隔离、安全或 Migration 风险。
- [ ] Phase 2 可从稳定基线开始，而不是修复基础架构缺陷。

## 7. 验收命令

```bash
pnpm install --frozen-lockfile
docker compose -f infra/docker/compose.yaml up -d postgres redis
pnpm db:migrate:deploy
pnpm verify
pnpm test:integration
pnpm test:e2e
git status --short
```

## 8. 手工验证步骤

按 `ACCEPTANCE_MATRIX.md` 从 A0-01 至 A1-15 逐项核对，记录通过证据或缺陷编号。

## 9. 输出

Phase 1 Gate 报告、架构交接文档、当前已知问题及 Phase 2 建议。
