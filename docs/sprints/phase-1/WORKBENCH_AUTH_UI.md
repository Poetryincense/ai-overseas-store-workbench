# WORKBENCH_AUTH_UI.md — P1-03 Authentication UI & Protected Routes

**Issue**: P1-03 — Authentication UI & Protected Routes
**Status**: `DONE`（本地 E2E 与 CI 配置见下文，以实际运行结果为准）

## 页面与路由

| 路由 | 类型 | 行为 |
|---|---|---|
| `/` | Server | 重定向到 `/dashboard` |
| `/login` | Server + Client form | 已登录时重定向到 `/dashboard`；否则显示中文登录表单 |
| `/dashboard` | Server（受保护 layout） | 未登录重定向到 `/login`；显示工作区名、用户名与退出按钮 |

受保护页面位于 `app/(protected)/`。`/login` 与 `/dashboard` 响应均设置 `Cache-Control: no-store`。

## 认证边界

- Workbench 的路由保护只决定 UI 跳转，不是安全边界。受保护 layout 在服务端调用 API `GET /api/v1/auth/me`（转发浏览器 Cookie），由 API 判定 Session 是否有效。
- API 返回 401 → 视为未登录并跳转；API 不可达或返回非 2xx（非 401）→ 显示「无法验证登录状态」错误态，**不会显示为已登录**。
- 浏览器通过同源路径 `/api/v1/*` 访问 API（Next.js rewrite 转发到 `API_INTERNAL_URL`）。因此 Session Cookie 保持 `SameSite=Lax` 与 HttpOnly，前端无需跨域 credentials。
- 登录流程：先 `GET /api/v1/auth/csrf` 获取 CSRF token，再以 `X-CSRF-Token` 头 `POST /api/v1/auth/login`。登出流程相同。
- 客户端不读取、不存储 Session Token；`localStorage` / `sessionStorage` 不保存凭据。CSRF token 仅保存在内存中用于本次请求。

## 表单状态

- 客户端校验：邮箱格式、密码非空、长度上限；校验失败不发送请求。
- 提交中：输入框禁用、按钮显示「登录中…」，并通过 `useRef` 守卫阻止重复提交（同一时刻只发送一个登录请求）。
- 错误提示：
  - `401` → 「邮箱或密码不正确。」（不区分邮箱是否存在）
  - `429` → 「尝试次数过多，请 15 分钟后再试。」
  - `403` → 「安全校验未通过，请刷新页面后重试。」
  - `503` / 网络错误 → 对应的通用提示
- 登录失败后清空密码输入框。

## 登出

`退出登录` 调用 `POST /api/v1/auth/logout`。API 撤销当前 Session 并清除 Cookie；前端随后跳转 `/login`。若登出请求失败，页面显示错误并保持当前状态，不伪装为已退出。

## 配置

| 变量 | 位置 | 说明 |
|---|---|---|
| `API_INTERNAL_URL` | Workbench 构建与运行 | Next rewrite 与服务端 `/me` 请求的 API 地址，默认 `http://127.0.0.1:4000`。**rewrite 目标在构建时写入，修改后需重新 `pnpm build`。** |
| `WEB_ORIGIN` | API | 浏览器访问 Workbench 的精确 Origin（默认 `http://localhost:3000`） |
| `AUTH_LOGIN_RATE_LIMIT_MAX` | API | 每 IP 每 15 分钟登录尝试上限，默认 `5`，范围 1–100；仅用于 E2E 调高 |

## 测试

| 类型 | 文件 | 覆盖 |
|---|---|---|
| 单元 | `apps/workbench/src/lib/auth-form.test.ts` | 表单校验、登录失败文案映射 |
| E2E（Playwright） | `apps/workbench/e2e/auth.spec.ts` | 未登录重定向、客户端校验不发请求、错误凭据统一提示、登录进入 Dashboard、刷新保持登录态、新标签页共享会话、Session Cookie 对 JS 不可读、重复提交只发一次请求、登出后受保护内容不可访问 |

运行方式（需要 PostgreSQL 已迁移，且 `pnpm build` 已完成）：

```bash
pnpm db:migrate:deploy
pnpm build
PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e   # 本机已安装 Google Chrome 时
pnpm test:e2e                             # CI：使用 playwright install 的 Chromium
```

E2E 通过 Playwright `webServer` 启动已构建的 API（`node apps/api/dist/index.js`，端口 4000）和 Workbench（`next start`，端口 3000），测试用户由 fixture 以随机后缀创建并在结束后清理。

## 已知限制

- 本阶段 Dashboard 只展示身份与工作区信息，不包含任何统计数据；真实统计由 P1-08 接入。
- 工作台导航未建设，页面中不提供未实现的业务入口。
- 浏览器后退缓存行为依赖浏览器实现；本阶段通过 `no-store` 与 API 重新校验降低风险，E2E 断言登出后后退不显示受保护内容。
