# 本地开发手册（Local Development Runbook）

本手册面向新开发者，从零启动「AI 海外独立站工作台 V1」的本地开发环境。

## 1. 环境要求

| 工具             | 版本         | 说明                                                        |
| ---------------- | ------------ | ----------------------------------------------------------- |
| Git              | 任意现代版本 | 仓库访问                                                    |
| Node.js          | `22.23.2`    | 见 `.node-version` 与根 `package.json` 的 `engines`         |
| pnpm             | `11.22.0`    | 见根 `package.json` 的 `packageManager`                     |
| Docker + Compose | 任意现代版本 | 用于本地 PostgreSQL 与 Redis（`infra/docker/compose.yaml`） |

> 版本锁定原则见 `DECISIONS.md` D-022：直接依赖使用精确版本，提交 `pnpm-lock.yaml`，CI 使用 frozen lockfile。

## 2. 初始化环境变量

```bash
cp .env.example .env
# 编辑 .env，替换示例密码（POSTGRES_PASSWORD）
```

`.env` 已被 `.gitignore` 忽略，严禁提交真实密码或连接串。
`WEB_ORIGIN` 必须精确匹配浏览器访问 Workbench 的 Origin（默认 `http://localhost:3000`），用于 CORS 与 CSRF 校验。

## 3. 启动 / 停止 PostgreSQL 与 Redis

```bash
# 启动（仅绑定本机 127.0.0.1）
docker compose -f infra/docker/compose.yaml up -d postgres redis

# 查看状态与健康检查
docker compose -f infra/docker/compose.yaml ps
docker compose -f infra/docker/compose.yaml exec -T postgres pg_isready   # 期望 accepting connections
docker compose -f infra/docker/compose.yaml exec -T redis redis-cli ping # 期望 PONG

# 停止（保留持久化数据）
docker compose -f infra/docker/compose.yaml down

# 完全清理（删除数据卷，需明确授权）
docker compose -f infra/docker/compose.yaml down -v
```

详见 `docs/sprints/phase-0/LOCAL_INFRASTRUCTURE.md`。

## 4. 安装依赖

```bash
pnpm install --frozen-lockfile
```

## 5. 启动三个应用

在三个独立终端中分别运行：

```bash
pnpm dev:api        # API          → http://127.0.0.1:4000
pnpm dev:worker     # Worker       → 输出 ready 日志后保持运行
pnpm dev:workbench  # Workbench    → http://localhost:3000
```

验证：

```bash
curl -fsS http://127.0.0.1:4000/health/live   # 期望 200
curl -fsS http://127.0.0.1:4000/health/ready  # PG 可用时 200，不可用时 503
```

### 5.1 初始化 Owner 与认证 API（无公开注册）

```bash
pnpm owner:create                 # 交互式输入 Email；密码隐藏输入并二次确认
pnpm owner:create --help          # 查看用法，不连接数据库
```

初始化命令只允许首次创建唯一 Owner、Workspace 和 OWNER Membership；重复执行会拒绝，不会覆盖密码。

认证 API：

```text
GET  /api/v1/auth/csrf  -> 获取 CSRF token（请求修改状态的接口前调用）
POST /api/v1/auth/login -> Email + password；需 Origin + CSRF cookie/header
POST /api/v1/auth/logout -> 撤销 Session；需 Origin + CSRF cookie/header
GET  /api/v1/auth/me    -> 返回当前用户、唯一 Workspace 与 OWNER 角色
```

前端跨域 fetch 需 `credentials: "include"`，并把 CSRF token 放入 `X-CSRF-Token`。API 只允许精确匹配 `WEB_ORIGIN` 的 Origin。Session Cookie 为 HttpOnly / SameSite=Lax；生产环境使用 Secure + `__Host-` 前缀。

浏览器访问 Workbench 首页 `http://localhost:3000`，应显示系统名与 Phase 0 状态，且不含模拟数据。

## 6. 执行所有检查

```bash
pnpm lint           # ESLint（--max-warnings=0）
pnpm format:check   # Prettier 格式检查
pnpm typecheck      # TypeScript strict 类型检查
pnpm test           # Vitest 单元测试
pnpm build          # 全量构建（含 next build）

pnpm verify         # 顺序执行上述全部检查
pnpm test:coverage  # 测试覆盖率报告（V8）
```

## 7. 常见故障处理

| 现象                                        | 排查与处理                                                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `pnpm install` 报 `ERR_PNPM_IGNORED_BUILDS` | 运行 `pnpm approve-builds --all`，或确认 `pnpm-workspace.yaml` 中 `allowBuilds` 已包含所需依赖（如 `esbuild: true`） |
| `/health/ready` 返回 503                    | PostgreSQL 未启动或 `DATABASE_URL` 配置错误；先执行第 3 步启动并确认 `pg_isready` 通过                               |
| `next build` 报 tsconfig 警告               | Next.js 会自动调整 `apps/workbench/tsconfig.json`（如 `jsx: react-jsx`），保留其改动                                 |
| 端口被占用                                  | 修改 `.env` 中 `PORT`（API），Workbench 端口见 Next.js 配置                                                          |
| `pnpm verify` 中 `format:check` 失败        | 运行 `pnpm format` 自动修复后重新提交                                                                                |

## 8. 安全边界

- 端口仅绑定 `127.0.0.1`，不对外暴露。
- 日志自动 `[REDACTED]` 密码、Token、连接串等敏感字段。
- 不提供公开注册接口；V1 通过受控初始化命令创建所有者（Phase 1 实现）。
- CI 不使用真实生产密钥（仅本地/CI 测试用密码）。
