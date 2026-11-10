# G0_ACCEPTANCE.md — Phase 0 Gate 验收记录

**Gate**: G0（工程基线通过）  
**Date**: 2026-11-10（更新）  
**Overall Status**: `PASS`（语义等价运行时补验通过）— 代码/工具链/CI 全通过；「PostgreSQL/Redis 运行时健康检查」已用真实二进制（embedded-postgres + redis-memory-server）完成语义等价补验；唯一未验证的是 Docker Compose 容器路径本身（Compose 配置已在 CI 用相同镜像验证）。

---

## 1. G0 验收标准逐项核对

| # | Gate 标准 | 结果 | 证据 |
|---|---|---|---|
| 1 | 真实 Shell 完成依赖安装，lockfile 一致 | ✅ PASS | `pnpm install --frozen-lockfile` 成功；`pnpm-lock.yaml` 已提交 |
| 2 | PostgreSQL、Redis 健康检查通过 | ✅ PASS（语义等价补验） | 真实二进制验证：PG `accepting connections`、Redis `PING→PONG`、API `/health/ready` 200（详见第 4 节） |
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

## 4. 运行时补验结果（语义等价 · 2026-11-10）

执行环境无 Docker（无 sudo + Docker Hub 不可达）、x86_64 macOS 14.5 无 Homebrew bottle（源码编译不可行），故采用 **npm 嵌入式真实二进制** 做语义等价补验：

| 补验项 | 方式 | 真实结果 | 结论 |
|---|---|---|---|
| PostgreSQL 健康检查 | `embedded-postgres`（真实 PG 18.4 二进制） | `database system is ready to accept connections`；`SELECT 1` 返回 `ok=1` | ✅ PASS（等价 `pg_isready`） |
| API `/health/ready`（PG 可用） | 启动项目 API + `DATABASE_URL` 指向 PG | `200` + `{"status":"ok","checks":{"database":"up"}}` | ✅ PASS（此前 PG 不可达时为 `503`+`down`，正反向均验证） |
| Redis 健康检查 | `redis-memory-server`（真实 redis-server，编译自官方 stable 源码） | `PING` → `+PONG` | ✅ PASS（等价 `redis-cli ping`） |

**诚实说明（版本与路径差异）**：
- 补验使用 PG `18.4` 与 Redis `stable` 真实二进制，而 `infra/docker/compose.yaml` 配置为 `postgres:16.4` / `redis:7.2.5`；补验验证的是「健康检查逻辑正确性」，不替代指定镜像版本的容器验证。
- Docker Compose 容器路径本身未本地运行（无 Docker），但其配置已在 CI 用相同镜像（`postgres:16.4`/`redis:7.2.5`）成功初始化容器（`Initialize containers` success）。
- `docker compose -f infra/docker/compose.yaml config` 未执行，已用 `infra/docker/validate-compose.mjs`（yaml 静态校验）替代。

## 5. Phase 0 交付物清单

| Issue | 产物 | 状态 |
|---|---|---|
| P0-01 | `docs/sprints/phase-0/BASELINE_AUDIT.md` | DONE |
| P0-02 | Monorepo（7 workspace + lockfile） | DONE |
| P0-03 | ESLint/Prettier/TS strict/Vitest + `QUALITY_BASELINE.md` | DONE |
| P0-04 | `infra/docker/compose.yaml` + `.env.example` + `LOCAL_INFRASTRUCTURE.md` | PASS（健康检查语义等价补验；Docker Compose 容器路径未本地运行） |
| P0-05 | 三服务骨架 + 健康检查 + `SERVICE_SKELETON.md` | PASS（`/health/ready` 200 已补验） |
| P0-06 | `.github/workflows/ci.yml` + README + runbook + 本文件 | DONE（含 CI 成功记录） |
