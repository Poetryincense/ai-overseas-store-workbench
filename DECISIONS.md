# Phase 0–1 技术与产品决策基线

本文件用于消除 AI 编码时的多义性。若目标仓库已有等效实现，先记录现状；只有存在明确技术问题时才提 ADR 变更。

| ID | 决策 | 当前基线 | 不在本阶段做什么 |
|---|---|---|---|
| D-001 | 包管理器 | 新仓库采用 pnpm workspace，并提交 lockfile | 不混用 npm/yarn/pnpm |
| D-002 | 语言 | TypeScript strict | 不引入第二套后端语言 |
| D-003 | Web | Workbench 使用 Next.js App Router | Phase 1 不创建 Storefront |
| D-004 | API | 独立 Node.js API 服务；新仓库优先 Fastify | 不把全部业务 API 混写进前端页面 |
| D-005 | 数据库 | PostgreSQL | 不用 SQLite 作为正式业务库 |
| D-006 | ORM | 新仓库优先 Prisma；已有成熟 ORM 则沿用 | 不同时引入 Prisma 和 Drizzle |
| D-007 | 缓存/队列基础 | Redis 只先完成本地服务和连接健康检查 | Phase 1 不实现复杂队列 |
| D-008 | 文件存储 | Phase 1 暂不接对象存储 | 不提前建设文件管理 |
| D-009 | 测试 | Vitest（单元/集成）+ Playwright（关键 UI E2E） | 不允许仅靠手工验收 |
| D-010 | 身份 | 单用户所有者账号；用受控命令初始化 | 不开放公开注册/邀请/组织管理 |
| D-011 | 工作空间 | 每个用户在 V1 恰有一个 Workspace | 不建设 Workspace 切换器 |
| D-012 | 项目 | 一个 Workspace 可有多个 Project | 不建设跨租户模型和租户计费 |
| D-013 | 项目类型 | `SINGLE_PRODUCT`、`VERTICAL_BRAND` | 不允许任意自定义工作流类型 |
| D-014 | 项目状态 | `DRAFT`、`ACTIVE`、`PAUSED`、`ARCHIVED` | 不在 Phase 1 引入运营阶段状态 |
| D-015 | 删除策略 | 只支持归档和恢复，不做物理删除 | 不做硬删除 API |
| D-016 | UI 语言 | 工作台管理界面简体中文；项目商业内容可多语言 | 不在 Phase 1 做完整 i18n 系统 |
| D-017 | API | `/api/v1`，统一错误和分页契约 | 不同时保留多个并行版本 |
| D-018 | 项目作用域 | 服务端从登录用户成员关系推导 Workspace；客户端不得指定 Workspace | 不信任请求体 workspaceId |
| D-019 | Dashboard | 只展示数据库真实统计 | 不展示虚构任务数、销售额或活动记录 |
| D-020 | 运行环境 | Docker Compose 提供 PostgreSQL、Redis；应用本地开发运行 | 暂不强制所有应用容器化 |
| D-021 | Workspace 包名 | `@workspace/workbench`、`@workspace/api`、`@workspace/worker`、`@workspace/database`、`@workspace/contracts`、`@workspace/shared`、`@workspace/config` | 不在不同 Issue 中自行变更包名 |

## 建议数据模型（Phase 1 最小集合）

### users
- `id` UUID 主键
- `email` 规范化小写、唯一
- `password_hash`
- `display_name` 可空
- `status`：ACTIVE / DISABLED
- `created_at`、`updated_at`

### workspaces
- `id` UUID 主键
- `name`
- `slug` 唯一
- `created_at`、`updated_at`

### workspace_members
- `id` UUID 主键
- `workspace_id`、`user_id` 外键
- `role`：V1 仅 OWNER
- `created_at`
- `UNIQUE(workspace_id,user_id)`；V1 对每个 user 限制只加入一个 workspace（可通过唯一约束或业务规则实现，并记录选型）

### sessions
- `id` UUID 主键
- `user_id` 外键
- `token_hash` 唯一，不保存原始 Cookie Token
- `expires_at`、`revoked_at`、`created_at`、`last_seen_at`

### projects
- `id` UUID 主键
- `workspace_id` 外键
- `name`、`slug`
- `project_type`：SINGLE_PRODUCT / VERTICAL_BRAND
- `status`：DRAFT / ACTIVE / PAUSED / ARCHIVED
- `description` 可空
- `created_by` 外键 users
- `created_at`、`updated_at`、`archived_at` 可空
- `UNIQUE(workspace_id,slug)`
- 索引：`(workspace_id,status)`、`(workspace_id,updated_at)`

### project_profiles
- `id` UUID 主键
- `project_id` 唯一外键 projects
- `initial_idea` 必填
- `target_market` 可空（例如 US、UK、US/CA）
- `business_model` 可空
- `primary_goal` 可空
- `budget_amount` 可空 Decimal；不使用浮点数存钱
- `budget_currency` 可空 ISO 4217 三位代码
- `constraints` JSON 可空
- `created_at`、`updated_at`

说明：`project_settings` 暂不建表，待出现明确设置字段时再建。不要为“未来可能用到”提前堆空表。

## 项目状态规则

- 创建时默认为 `DRAFT`。
- `DRAFT` → `ACTIVE` 或 `ARCHIVED`。
- `ACTIVE` → `PAUSED` 或 `ARCHIVED`。
- `PAUSED` → `ACTIVE` 或 `ARCHIVED`。
- `ARCHIVED` → `PAUSED`（恢复后默认暂停，避免恢复即自动运行）。
- 任何非法状态转换由服务端返回明确 409 错误。
- 归档时设置 `archived_at`；恢复时清空。

## API 最小契约

### Auth
- `POST /api/v1/auth/login`：email + password；成功设置 HttpOnly Cookie。
- `POST /api/v1/auth/logout`：撤销当前 Session 并清 Cookie。
- `GET /api/v1/auth/me`：返回用户和唯一 Workspace 的摘要。
- 不提供 `/register`。

### Projects
- `GET /api/v1/projects?page=1&pageSize=20&status=&type=&q=`
- `POST /api/v1/projects`
- `GET /api/v1/projects/:projectId`
- `PATCH /api/v1/projects/:projectId`
- `POST /api/v1/projects/:projectId/activate`
- `POST /api/v1/projects/:projectId/pause`
- `POST /api/v1/projects/:projectId/archive`
- `POST /api/v1/projects/:projectId/restore`

### Dashboard
- `GET /api/v1/dashboard/summary`
- 返回真实项目数量、状态数量、最近项目；不返回尚未建设的任务、销售或运营指标。

## API 响应建议

成功响应统一包含 `data`；列表包含 `items`、`page`、`pageSize`、`total`。错误统一包含 `error.code`、`error.message`、`error.requestId`。不得向客户端返回 SQL、堆栈、凭据或其他项目内容。
