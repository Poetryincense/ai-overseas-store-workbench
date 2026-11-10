# AUTHENTICATION.md — P1-02 Owner Bootstrap & Auth API

**Issue**: P1-02 — Owner Bootstrap & Authentication API
**Date**: 2026-11-11
**Status**: `DONE`

## API 契约

| Method / Path | 认证 | 写保护 | 行为 |
|---|---|---|---|
| `GET /api/v1/auth/csrf` | 否 | 不适用 | 设置 CSRF double-submit cookie，返回 token |
| `POST /api/v1/auth/login` | 否 | 精确 Origin + CSRF cookie/header | 校验 Email/密码，撤销既有 session 后创建新 Session |
| `POST /api/v1/auth/logout` | Session cookie | 精确 Origin + CSRF cookie/header | 撤销当前 Session 并清理 Cookie |
| `GET /api/v1/auth/me` | Session cookie | 否 | 返回 user、唯一 Workspace、role |

成功响应 envelope 为 `{ "data": ... }`；错误为 `{ "error": { "code", "message", "requestId" } }`。没有 `/register` 路由。登录失败对不存在、禁用用户及错误密码均返回相同 `401 INVALID_CREDENTIALS`。

## Owner 初始化

```bash
pnpm owner:create
```

Email 和可选 display name 通过终端交互读取；密码以 raw terminal mode 隐藏输入并二次确认，不接受命令行密码参数。命令先验证 Email 和 12 字符最低密码长度，再以 Argon2id 哈希。User、Workspace、WorkspaceMember 在一个 Prisma 事务中创建；PostgreSQL transaction advisory lock 串行化多个并发初始化进程。数据库已有任意 OWNER membership 时拒绝，不覆盖用户或密码。

`pnpm owner:create --help` 不连接数据库。命令从仓库根 `.env` 或 `packages/database/.env` 读取 `DATABASE_URL`，已有进程环境变量优先。

## 安全机制

- 密码：Argon2id，19 MiB memory / 2 iterations / parallelism 1；共享实现位于 `packages/shared/src/password.ts`。
- Session：`randomBytes(32)` 高熵 base64url Token；DB 仅保存 SHA-256 hash；7 天过期。
- 认证路由响应设置 `Cache-Control: no-store`，避免浏览器或中间缓存保存 CSRF token / 用户摘要。
- 轮换：成功登录先撤销该 user 所有未撤销 Session，再事务创建新 Session。
- Cookie：`HttpOnly; SameSite=Lax; Path=/`；生产环境加 `Secure` 并使用 `__Host-` 名称。
- CSRF：`GET /csrf` 生成随机 double-submit token；写请求必须提交同值 Cookie 与 `X-CSRF-Token`，并且 `Origin` 精确等于 `WEB_ORIGIN`。
- CORS：仅允许一个配置的 `WEB_ORIGIN`，credentials 开启；不允许通配 Origin。
- 限速：登录每 IP 15 分钟最多 5 次；当前 rate-limit store 为单进程内存，V1 单实例适用，多实例部署前需配置共享存储。
- 请求日志仅包含 requestId、method、path、statusCode，不记录 request body、Cookie 或 Authorization。

## 集成测试

`apps/api/src/auth.test.ts` 使用真实 PostgreSQL 与迁移后的测试库，覆盖 CSRF/Origin 拒绝、CORS 白名单、通用登录错误、Cookie 属性、Session 哈希存储/登录轮换/登出撤销、过期/撤销 Session、`/me` 数据脱敏和登录限速。

```bash
pnpm db:migrate:deploy
pnpm --filter @workspace/api run test:integration
```

运行集成测试前需设置仓库根 `.env` 或 `DATABASE_URL` 环境变量。测试用随机后缀数据并在结束后清理。
