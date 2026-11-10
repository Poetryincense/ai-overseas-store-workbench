# SERVICE_SKELETON.md — P0-05 Service Skeleton & Health Checks

**Issue**: P0-05 — Service Skeleton & Health Checks  
**Date**: 2026-11-08  
**Status**: `PASS`（语义等价补验）— 三服务骨架、健康检查、结构化日志均完成并运行时验证通过；「PG 可用时 `/health/ready` 返回 200」场景已用真实二进制（embedded-postgres）补验通过。

---

## 1. 三个最小可运行服务

| 服务 | 技术栈（固定版本） | 入口 | 端口 |
|---|---|---|---|
| `@workspace/workbench` | Next.js `16.4.5` App Router + React `19.3.1` | `src/app/` | `3000` |
| `@workspace/api` | Fastify `5.12.8` + pg `8.23.1` | `src/index.ts` | `4000` |
| `@workspace/worker` | Node.js 内置（无额外运行时依赖） | `src/index.ts` | 无（进程） |

三个进程可独立启动，互不依赖；Workbench 不直接连接数据库。

---

## 2. 健康检查端点（API）

- `GET /health/live`：进程存活，**不依赖任何外部服务**，恒返回 `200`。
- `GET /health/ready`：就绪检查，验证 PostgreSQL（`SELECT 1`，连接超时 `2000ms`）；PG 可达返回 `200`，不可达返回 `503`。

响应不包含连接串、版本秘密或内部异常堆栈。每次响应附带 `X-Request-Id` 请求头。

```json
{ "status": "ok", "service": "api" }
{ "status": "unhealthy", "service": "api", "checks": { "database": "down" } }
```

---

## 3. 结构化日志

统一 JSON 结构化日志，由 `@workspace/shared` 的 `createLogger(service)` 提供，字段包含：

- `timestamp`（ISO 8601）
- `level`（debug/info/warn/error）
- `service`（workbench/api/worker）
- `message`
- API 请求日志额外包含 `requestId`、`method`、`url`、`statusCode`

敏感字段（`password`、`token`、`authorization`、`cookie`、`connection`、`database_url`、`redis_url` 等）在写入日志前自动 `[REDACTED]`，不记录明文凭据。

---

## 4. 环境配置

由 `@workspace/config` 的 `loadEnv()` 统一加载，安全默认值：

- `HOST` 默认 `127.0.0.1`（仅本机绑定，不对外暴露）
- `PORT` 默认 `4000`（非法值抛错）
- `DATABASE_URL` / `REDIS_URL` 从环境读取（无硬编码凭据，缺失时 `undefined`）

---

## 5. 启动命令（root scripts）

```bash
pnpm dev:api        # 构建 packages + api，启动 http://127.0.0.1:4000
pnpm dev:worker     # 构建 packages + worker，输出 ready 日志
pnpm dev:workbench  # 构建 packages + next dev，启动 http://localhost:3000
pnpm dev            # 默认指向 dev:api
```

---

## 6. 运行时验证结果（真实执行）

| 验证项 | 命令 | 实际结果 | 状态 |
|---|---|---|---|
| API 启动 | `node apps/api/dist/index.js` | `{"message":"api started","host":"127.0.0.1","port":4000}` | `PASS` |
| API live | `curl /health/live` | `200` + `{"status":"ok","service":"api"}` + `X-Request-Id` | `PASS` |
| API ready（PG 不可达） | `curl /health/ready` | `503` + `{"status":"unhealthy",...,"checks":{"database":"down"}}` | `PASS` |
| API 优雅关闭 | `SIGTERM` | `{"message":"shutting down","signal":"SIGTERM"}` | `PASS` |
| Worker 启动 | `node apps/worker/dist/index.js` | `{"message":"worker ready","version":"0.1.0"}` | `PASS` |
| Worker 优雅关闭 | `SIGTERM` | `{"message":"worker shutting down","signal":"SIGTERM"}` + exit 0 | `PASS` |
| Workbench 构建 | `pnpm build`（next build） | `✓ Compiled successfully`，静态页面 `/` 与 `/_not-found` | `PASS` |
| Workbench 访问 | `next start` + `curl /` | `200`，页面显示系统名 + Phase 0 状态，无虚构数据 | `PASS` |
| API ready（PG 可用） | `DATABASE_URL` 指向真实 PG + `curl /health/ready` | `200` + `{"status":"ok","checks":{"database":"up"}}` | `PASS`（补验） |

### 日志含密检查
启动、请求、关闭日志均仅含 `host/port/statusCode/requestId/method/url/signal` 等安全字段，无 `DATABASE_URL`、密码或连接串泄漏。

---

## 7. 测试覆盖

- `@workspace/api`：`/health/live` 200、`/health/ready` 503（DB 不可用）、`X-Request-Id` 头（4 个用例，用 Fastify `inject` 不监听端口）。
- `@workspace/worker`：`getWorkerBootstrapStatus` 纯函数。
- 共享层：`loadEnv`、`createLogger` 等由现有测试覆盖。
- 全仓单测：`7 files / 11 tests`，全部通过。

---

## 8. 阻塞项

「PG 可用时 `/health/ready` 返回 200」已通过 `embedded-postgres`（真实 PG 二进制）补验通过（见 `G0_ACCEPTANCE.md` 第 4 节）。「Workbench/API 经容器网络连接 PG」的 Docker Compose 容器路径本身未本地运行（无 Docker），但 Compose 配置已在 CI 用相同镜像验证。
