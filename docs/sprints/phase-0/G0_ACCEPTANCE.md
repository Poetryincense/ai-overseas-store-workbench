# G0_ACCEPTANCE.md — Phase 0 Gate 验收记录

**Gate**: G0（工程基线通过）  
**Date**: 2026-11-08  
**Overall Status**: `PARTIAL` — 代码/工具链/CI 全通过；仅「PostgreSQL/Redis 运行时健康检查」因执行环境无 Docker 标记 BLOCKED（CI 侧容器服务已正常初始化）。

---

## 1. G0 验收标准逐项核对

| # | Gate 标准 | 结果 | 证据 |
|---|---|---|---|
| 1 | 真实 Shell 完成依赖安装，lockfile 一致 | ✅ PASS | `pnpm install --frozen-lockfile` 成功；`pnpm-lock.yaml` 已提交 |
| 2 | PostgreSQL、Redis 健康检查通过 | ⛔ BLOCKED（本地） / ✅ CI 容器正常初始化 | 本地无 Docker，`pg_isready`/`redis-cli ping` 未执行；CI job `Initialize containers` success |
| 3 | Workbench、API、Worker 均能启动 | ✅ PASS | P0-05 运行时验证：API 200/503、Worker ready、Workbench 200 |
| 4 | lint、typecheck、test、build 通过 | ✅ PASS | `pnpm verify` 全绿（`VERIFY_EXIT=0`，11 tests） |
| 5 | CI 在干净环境通过 | ✅ PASS | CI run #42510487668 `conclusion: success`，11 步骤全绿 |
| 6 | README 能让新环境开发者按步骤启动 | ✅ PASS | `README.md` 快速开始 + `docs/runbooks/local-development.md` |

---

## 2. CI 运行记录

- **Workflow**: `.github/workflows/ci.yml`（触发：push 到 `main` + pull_request）
- **Run**: https://github.com/Poetryincense/ai-overseas-store-workbench/actions/runs/42510487668
- **Head SHA**: `372c890`（P0-06 提交）
- **结论**: `success`，job 名 `Lint / Format / Typecheck / Test / Build`，runner `ubuntu-latest`

关键步骤（全部 success）：

| Step | 结果 |
|---|---|
| Initialize containers（postgres:16.4 + redis:7.2.5） | ✅ |
| Install dependencies（`pnpm install --frozen-lockfile`） | ✅ |
| Lint | ✅ |
| Format check | ✅ |
| Typecheck | ✅ |
| Test | ✅ |
| Build（含 next build） | ✅ |

---

## 3. 负向验证（「故意失败 → CI 失败」）— 已完成

通过真实 push 验证 CI 的失败检测与恢复路径：

| 提交 | 内容 | CI run | 结论 |
|---|---|---|---|
| `89ba50e` | 故意破坏测试断言 | #42596660674 | ❌ `failure`（`Test` 步骤失败，`Build` 步骤 fail-fast 跳过） |
| `9732227` | `git revert` 恢复 | #42597400850 | ✅ `success` |

结论：CI 能正确检测失败（非零退出码 → job `failure`），恢复后回到 `success`，负向路径验证通过。

## 4. 待补验 / 已知限制

1. **PostgreSQL/Redis 本地运行时健康检查**：执行环境无 Docker（`docker`/`podman`/`colima`/`psql`/`redis-cli` 均 UNAVAILABLE），本地 `pg_isready` / `redis-cli ping` 未执行。CI 侧已用 service 容器初始化 PG/Redis（`Initialize containers` success），但本地 `/health/ready` 在 PG 可用时的 200 场景仍未真实验证。
2. **Docker Compose 配置运行时验证**：`docker compose -f infra/docker/compose.yaml config` 未执行（无 Docker），已用 `infra/docker/validate-compose.mjs`（yaml 静态校验）替代。

---

## 5. Phase 0 交付物清单

| Issue | 产物 | 状态 |
|---|---|---|
| P0-01 | `docs/sprints/phase-0/BASELINE_AUDIT.md` | DONE |
| P0-02 | Monorepo（7 workspace + lockfile） | DONE |
| P0-03 | ESLint/Prettier/TS strict/Vitest + `QUALITY_BASELINE.md` | DONE |
| P0-04 | `infra/docker/compose.yaml` + `.env.example` + `LOCAL_INFRASTRUCTURE.md` | PARTIAL（运行时 BLOCKED） |
| P0-05 | 三服务骨架 + 健康检查 + `SERVICE_SKELETON.md` | PARTIAL（PG ready 200 BLOCKED） |
| P0-06 | `.github/workflows/ci.yml` + README + runbook + 本文件 | DONE（含 CI 成功记录） |
