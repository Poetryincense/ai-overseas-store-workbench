# P1-02 — Owner Bootstrap & Authentication API

**优先级**：P0  
**估算**：1 工程日  
**依赖**：P1-01  
**可并行**：否（认证核心）

## 1. 目标

实现受控初始化唯一所有者账号，以及登录、登出、当前用户 API。V1 不开放公开注册。

## 2. 输入文件（先读）

- `packages/database/` Schema、Migration、DB Client
- `apps/api/` 服务入口与路由注册
- `packages/contracts/` DTO、错误结构
- `.env.example`、安全日志规则
- `DECISIONS.md` 中 Auth 数据模型

## 3. 修改范围

### Owner 初始化命令

提供受控命令 `pnpm owner:create`，并在根 `package.json` 增加统一转发脚本：
- 通过交互输入或受保护环境变量接收 email/password；
- 密码进行强哈希（优先 Argon2id；若仓库现有方案成熟则记录）；
- 创建 User、Workspace、WorkspaceMember(OWNER)；
- 使用事务保证一致性；
- 已存在 Owner 时安全拒绝或要求显式维护流程，不得静默覆盖密码；
- 密码不得出现在命令日志或 shell history（优先交互隐藏输入）。

### API

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Session：
- Cookie 保存高熵随机 Token；DB 保存 Token hash；
- 登录成功轮换 Session；
- 过期/撤销 Session 拒绝访问；
- Cookie：HttpOnly、SameSite=Lax 或更严格；生产环境 Secure；
- 写请求 CSRF 防护；精确 CORS Origin 和 credentials；
- 登录失败统一返回通用错误；限制登录尝试频率。

`/me` 返回当前 user、单一 Workspace 摘要和权限角色，不返回 passwordHash/session token。

## 4. 禁止事项

- 不提供 `/register` 或任意用户自助创建 Workspace。
- 不把密码明文写入 DB、日志、Prompt 或前端。
- 不把原始 Session Token 写进 DB。
- 不允许客户端指定 userId、workspaceId 或 role。
- 不得将登录失败区分为“邮箱不存在/密码错误”。
- 不得把无 CSRF 保护的 Cookie 写 API 暴露为可跨站调用。

## 5. 实施步骤

1. 明确密码哈希、Session Token 和 CSRF 实现并记录 ADR（如仓库已有方案则复用）。
2. 实现 Owner bootstrap 命令。
3. 实现登录、登出、me API 和统一错误。
4. 实现 rate limit、CORS/Cookie 配置和请求日志脱敏。
5. 编写单元及 API 集成测试。

## 6. 验收标准

- [ ] 初始化命令创建一个 User、一个 Workspace、一个 OWNER Membership。
- [ ] 重复初始化不能覆盖现有账号。
- [ ] 登录成功设置安全 Cookie。
- [ ] 错误凭据不会泄露账户存在性。
- [ ] 登出后当前 Session 立即失效。
- [ ] 过期/撤销 Session 无法访问受保护路由。
- [ ] `/me` 不泄露秘密。
- [ ] 未登录的 `/me` 返回 401。
- [ ] 有登录速率限制和 CSRF 防护。

## 7. 验收命令

```bash
pnpm owner:create --help
pnpm --filter @workspace/api test -- auth
pnpm --filter @workspace/api test:integration -- auth
pnpm lint && pnpm typecheck && pnpm test
```

实际测试命令若不同，必须在 package scripts 中有明确映射。

## 8. 手工验证步骤

1. 在空测试库初始化 Owner。
2. 登录并检查 Cookie 标志。
3. 请求 `/me`，确认返回用户和 Workspace。
4. 登出后重放原 Cookie，确认 401。
5. 使用错误密码尝试登录，确认响应不透露账号存在性。
6. 检查应用日志与命令输出无密码和 Token。

## 9. 输出

Owner bootstrap、Auth API、Session/CSRF 机制、测试和安全配置说明。
