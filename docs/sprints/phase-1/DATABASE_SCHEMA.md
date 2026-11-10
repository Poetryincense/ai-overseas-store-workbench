# DATABASE_SCHEMA.md — P1-01 Identity, Workspace & Project Schema

**Issue**: P1-01 — Identity, Workspace & Project Schema  
**Date**: 2026-11-10  
**Status**: `DONE`

---

## 1. 技术选型

- ORM：Prisma `7.10.1`（稳定版；Prisma 8 尚在 RC）
- Provider：PostgreSQL（driver adapter：`@prisma/adapter-pg`）
- Client 生成位置：`packages/database/src/generated/prisma`（git-ignored，由 `prisma generate` 生成）
- 配置：`packages/database/prisma7.config.ts`（Prisma 7 新配置格式，datasource url 来自 `DATABASE_URL`）

---

## 2. 数据模型（6 表 + 4 枚举）

严格遵循 `DECISIONS.md` 建议数据模型，字段 camelCase 代码侧 / snake_case 数据库列（`@map`）。

### 枚举

| 枚举 | 值 |
|---|---|
| `UserStatus` | `ACTIVE` / `DISABLED` |
| `MemberRole` | `OWNER`（V1 仅此一种） |
| `ProjectType` | `SINGLE_PRODUCT` / `VERTICAL_BRAND` |
| `ProjectStatus` | `DRAFT` / `ACTIVE` / `PAUSED` / `ARCHIVED` |

### 表

| 表 | 关键字段 | 约束 |
|---|---|---|
| `users` | `id`(UUID)、`email`、`passwordHash`、`displayName?`、`status` | `email` 唯一 |
| `workspaces` | `id`、`name`、`slug` | `slug` 唯一 |
| `workspace_members` | `workspaceId`、`userId`、`role` | `(workspaceId,userId)` 唯一；`userId` 唯一（V1 每用户一个 Workspace）；外键 → workspaces/users |
| `sessions` | `userId`、`tokenHash`、`expiresAt`、`revokedAt?`、`lastSeenAt?` | `tokenHash` 唯一（不存原始 Token）；外键 → users |
| `projects` | `workspaceId`、`name`、`slug`、`projectType`、`status`、`description?`、`createdById?`、`archivedAt?` | `(workspaceId,slug)` 唯一；索引 `(workspaceId,status)`、`(workspaceId,updatedAt)`；外键 → workspaces/users |
| `project_profiles` | `projectId`、`initialIdea`、`targetMarket?`、`businessModel?`、`primaryGoal?`、`budgetAmount?`(Decimal)、`budgetCurrency?`(3 位)、`constraints?`(JSONB) | `projectId` 唯一（一对一）；外键 → projects |

时间字段统一 `TIMESTAMPTZ`（UTC）；`budgetAmount` 用 `DECIMAL(12,2)`（不用浮点）。

---

## 3. Migration

- 名称：`20261110055149_init`
- 路径：`packages/database/prisma/migrations/20261110055149_init/migration.sql`
- 从空库生成，含 4 个 `CREATE TYPE`、6 个 `CREATE TABLE`、7 个唯一索引、4 个普通索引、6 个外键约束。

### 回滚 / 恢复策略
- **开发环境**：`pnpm db:migrate:dev` 或 `prisma migrate reset`（重置并重放迁移）。
- **生产环境**：Prisma 不提供自动 down migration；采用「向前修复」——新增反向 migration（如删除表/列）而非回滚已有 migration，避免破坏历史数据。

---

## 4. DB Client 与脚本

### 导出（`packages/database/src/index.ts`）
- `PrismaClient`、模型类型（`User`/`Workspace`/`WorkspaceMember`/`Session`/`Project`/`ProjectProfile`）、枚举
- `createPrismaClient(databaseUrl)`：工厂函数，内部用 `PrismaPg` adapter 构造 `PrismaClient`

### 脚本
| 命令 | 实现 |
|---|---|
| `pnpm db:generate` | `prisma generate`（转发到 `@workspace/database`） |
| `pnpm db:migrate:dev` | `prisma migrate dev` |
| `pnpm db:migrate:deploy` | `prisma migrate deploy` |
| `pnpm db:migrate:status` | `prisma migrate status` |
| `pnpm db:studio` | `prisma studio` |

---

## 5. 测试覆盖（`packages/database/src/schema.test.ts`，8 用例）

- 重复 `email` 拒绝（唯一约束）
- 重复 workspace `slug` 拒绝
- 每用户一个 Workspace（`workspace_members.user_id` 唯一）
- 同 workspace 重复 project `slug` 拒绝
- ProjectProfile 与 Project 一对一（第二个 profile 拒绝）
- 外键约束（不存在 workspace 拒绝）
- `budgetAmount` Decimal 精度（`12345.67` 精确存储）
- Project 状态默认 `DRAFT`

测试使用真实 PostgreSQL（`DATABASE_URL`），数据以唯一后缀隔离并在 `afterAll` 清理。

---

## 6. 验收命令结果

```text
pnpm db:generate       -> PASS（Generated Prisma Client 7.10.1）
pnpm db:migrate:status -> PASS（1 migration, up to date）
pnpm db:migrate:deploy -> PASS（No pending migrations，幂等）
pnpm --filter @workspace/database test -> PASS（9 tests）
pnpm typecheck         -> PASS
```
