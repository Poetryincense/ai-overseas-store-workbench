# P1-03 — Authentication UI & Protected Routes

**优先级**：P0  
**估算**：0.5–1 工程日  
**依赖**：P1-02  
**可并行**：否（WorkBench 路由入口）

## 1. 目标

实现中文登录界面、登录态管理、登出入口和受保护页面访问策略。

## 2. 输入文件（先读）

- `apps/workbench/` App Router、layout、middleware/proxy 配置
- API Auth 契约和 OpenAPI
- `packages/contracts/` Auth DTO
- UI 组件库和设计规范（存在时）

## 3. 修改范围

页面：
- `/login`
- `/dashboard`（受保护占位布局，真实统计由 P1-08 完成）

组件/能力：
- 登录表单：邮箱、密码、提交状态、错误提示；
- 受保护 Layout：未登录重定向 `/login`；
- 登出按钮；
- 登录后跳转 Dashboard；
- API 调用采用同源/受控代理或准确配置 credentials，不把 Session Token 读入 JS。

注意：如果通过 Next.js Middleware/Proxy 预检查 Cookie，仍必须由 API 服务端再次验证 Session；前端路由保护不是 API 安全边界。

## 4. 禁止事项

- 不得把密码或 Session Token 存在 localStorage/sessionStorage。
- 不得使用客户端硬编码的“已登录”布尔值。
- 不得把 API 认证失败显示为已登录。
- 不得创建公开注册页面。
- 不得添加未实现的业务菜单并伪装可用。

## 5. 实施步骤

1. 建立登录页面和表单 Schema。
2. 对接 Auth API。
3. 建立会话查询与受保护 Layout。
4. 实现登出和状态清理。
5. 配置 Playwright（若仓库尚未配置），添加 `test:e2e` 根脚本和登录 UI E2E。

## 6. 验收标准

- [ ] 未登录打开 `/dashboard` 自动跳转 `/login`。
- [ ] 正确账号密码登录后进入 Dashboard。
- [ ] 错误凭据有友好且不泄露账户存在性的提示。
- [ ] 刷新页面仍保持有效登录态。
- [ ] 登出后受保护页面不可访问。
- [ ] UI 不暴露 Session Token。
- [ ] 表单有加载、防重复提交和错误状态。

## 7. 验收命令

```bash
pnpm --filter @workspace/workbench test
pnpm test:e2e -- auth.spec.ts
pnpm lint && pnpm typecheck && pnpm build
```

## 8. 手工验证步骤

1. 清除 Cookie 后访问 `/dashboard`。
2. 登录成功并刷新页面。
3. 新开标签页确认登录态一致。
4. 登出后使用浏览器后退，确认受保护数据不再显示。
5. 浏览器开发者工具检查 localStorage/sessionStorage 中无 Session Token。

## 9. 输出

登录 UI、受保护路由、会话体验、E2E 测试。
