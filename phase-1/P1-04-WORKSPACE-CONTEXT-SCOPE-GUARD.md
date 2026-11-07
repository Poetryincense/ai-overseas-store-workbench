# P1-04 — Workspace Context & Project Scope Guard

**优先级**：P0（安全边界）  
**估算**：0.5–1 工程日  
**依赖**：P1-01、P1-02  
**可并行**：可与 P1-05 有限并行；不得修改 Schema 或 Auth 核心

## 1. 目标

建立统一 Workspace Context Resolver 和 Project Scope Guard。所有后续业务 API 必须从已验证的 Session 推导当前 Workspace，而不是信任客户端参数。

## 2. 输入文件（先读）

- Auth API、中间件、Session Service
- WorkspaceMember 模型与 DB Client
- API 插件注册、请求上下文类型
- 现有权限/数据访问层

## 3. 修改范围

实现：
- Authenticated Request Context：`userId`、`workspaceId`、`membershipRole`、`sessionId`；
- `requireAuth`：验证 Session；
- `resolveWorkspaceContext`：查询当前用户唯一有效 Workspace Membership；
- `requireProjectInWorkspace(projectId)`：查询必须带 `workspaceId`；
- 统一 401/404/403 错误策略；对于不属于当前 Workspace 的项目 ID，默认返回 404，防止枚举。

数据访问层建议提供 scoped repository 方法，例如：
`findProjectById({ projectId, workspaceId })`。

## 4. 禁止事项

- 禁止从 body/query/header 接受并信任 workspaceId。
- 禁止全局可调用的 `findProjectById(projectId)` 被业务 API 直接使用。
- 禁止只在前端隐藏其他项目。
- 禁止通过返回 403 明确暴露其他 Workspace 是否存在该项目（除非安全 ADR 明确批准）。
- 不得在此任务中添加多租户管理员、组织切换或邀请能力。

## 5. 实施步骤

1. 定义 Request Context 类型。
2. 实现 Session → User → Membership → Workspace 的解析。
3. 实现 Project scope helper/repository。
4. 将错误结构接入统一 Error Handler。
5. 为未登录、无 Membership、跨 Workspace 项目访问添加测试。

## 6. 验收标准

- [ ] 所有受保护业务路由只能取得服务端构造的 Workspace Context。
- [ ] 无有效 Membership 时拒绝访问。
- [ ] Project 查询同时包含 projectId 和 workspaceId。
- [ ] 客户端提交伪造 workspaceId 不改变实际作用域。
- [ ] 跨 Workspace 项目访问返回统一 404。
- [ ] 日志不泄露其他项目数据。

## 7. 验收命令

```bash
pnpm --filter @workspace/api test -- workspace-context
pnpm --filter @workspace/api test:integration -- project-scope
pnpm lint && pnpm typecheck && pnpm test
```

## 8. 手工验证步骤

1. 创建两个测试 Workspace 和两名测试用户（仅测试工厂可创建）。
2. 用户 A 请求用户 B 的项目 ID，确认 404。
3. 用户 A 在 body 中伪造用户 B 的 workspaceId，确认仍按 A 的 Workspace 查询。
4. 删除/撤销用户 A 的 Membership 后，确认 API 拒绝访问。

## 9. 输出

统一 Auth/Workspace Context、Project scope helper、集成测试与安全说明。
