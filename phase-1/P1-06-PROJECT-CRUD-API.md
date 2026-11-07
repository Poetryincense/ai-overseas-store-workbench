# P1-06 — Project CRUD API

**优先级**：P0  
**估算**：1 工程日  
**依赖**：P1-04、P1-05  
**可并行**：否（Project API 路由/Service 注册）

## 1. 目标

实现 Workspace 作用域内项目创建、列表、详情、更新、状态动作 API，补充 OpenAPI/接口文档和集成测试。

## 2. 输入文件（先读）

- Workspace Context / Project Scope Guard
- Project Domain Service、DTO Schema
- Prisma Model / DB Client
- API Router、统一错误和分页契约

## 3. 修改范围

实现：

```http
GET    /api/v1/projects?page=1&pageSize=20&status=&type=&q=
POST   /api/v1/projects
GET    /api/v1/projects/:projectId
PATCH  /api/v1/projects/:projectId
POST   /api/v1/projects/:projectId/activate
POST   /api/v1/projects/:projectId/pause
POST   /api/v1/projects/:projectId/archive
POST   /api/v1/projects/:projectId/restore
```

Create API 在同一 DB transaction 中创建 Project 和 ProjectProfile。
List：分页、状态/类型筛选、名称/描述搜索；排序只允许白名单字段。
Get/Patch/State action：必须通过 Project Scope Guard。
Patch 只允许修改 `name`、`description` 和明确允许的 profile 字段；不允许修改 ID、Workspace、createdBy、归档时间和系统状态字段。

错误语义：400 参数校验；401 未登录；404 不存在/不属于当前 Workspace；409 状态冲突/Slug 冲突无法解决；500 通用服务错误（不暴露栈）。

## 4. 禁止事项

- 不得实现硬删除端点。
- 不得使用客户端提交的 workspaceId。
- 不得在 Handler 中散落业务状态转换逻辑。
- 不得返回未授权项目的字段或“项目存在但无权限”差异。
- 不得无上限返回项目列表。

## 5. 实施步骤

1. 实现 scoped Project Repository。
2. 实现 Create/List/Get/Update API。
3. 实现状态动作 API。
4. 接入统一分页和错误格式。
5. 更新 OpenAPI 或接口文档。
6. 增加 API 集成测试和权限测试。

## 6. 验收标准

- [ ] Create 在事务中创建 Project 与 Profile。
- [ ] List 分页和筛选正确。
- [ ] Get/Patch/状态操作均校验 Workspace。
- [ ] 非法状态返回 409。
- [ ] 跨 Workspace 访问统一 404。
- [ ] API 不接受 workspaceId/createdBy 字段。
- [ ] 不存在 DELETE 物理删除 API。
- [ ] API 契约与实现一致。

## 7. 验收命令

```bash
pnpm --filter @workspace/api test -- projects
pnpm --filter @workspace/api test:integration -- projects
pnpm lint && pnpm typecheck && pnpm test
```

## 8. 手工验证步骤

1. 登录后创建 SINGLE_PRODUCT 项目，检查 Project 与 Profile 均存在。
2. 创建 VERTICAL_BRAND 项目，检查类型正确。
3. 列表测试 page/pageSize/status/type/q。
4. 修改项目名称和 Profile 字段。
5. 归档后确认普通列表可按状态过滤；恢复后状态为 PAUSED。
6. 用伪造 Project ID 和 workspaceId 测试 scope。

## 9. 输出

Project API、Repository、OpenAPI、集成测试和接口使用文档。
