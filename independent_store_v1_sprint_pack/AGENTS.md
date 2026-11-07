# AGENTS.md — AI 海外独立站工作台（Phase 0–1）

## 1. 项目使命

本仓库建设个人 AI 海外独立站工作台。V1 一个个人工作空间可以管理多个独立项目。当前 Sprint 只完成工程基础、单用户认证、工作空间上下文、多项目管理和基础 Dashboard；不得提前实现后续阶段功能。

## 2. 最高优先级规则

### 2.1 先审计再修改
- 开始任何任务前先读取本文件、对应 Issue、`SPRINT_PLAN.md`、`DECISIONS.md` 和相关现有代码。
- 先运行 `git status --short`，识别用户未提交变更。
- 不得覆盖、删除或格式化与任务无关的文件。
- 如果仓库现有结构与任务包示例不一致，先做路径映射，不得直接整体搬迁。

### 2.2 项目数据隔离
- 所有项目查询都必须绑定当前认证用户解析出的 `workspaceId`。
- 禁止从请求体或查询参数接受并信任客户端传入的 `workspaceId`。
- 按项目读取或修改数据时，必须同时验证项目属于当前 Workspace。
- 不允许使用无作用域的 Project 查询进行业务操作。
- 不得在日志、错误消息或响应中泄漏其他项目的数据。

### 2.3 认证与秘密
- 不提供公开注册接口；V1 通过受控的一次性初始化命令创建唯一工作台所有者。
- 密码只保存强哈希，不保存明文；会话使用不可预测的随机 Token，数据库只保存 Token 哈希。
- Cookie 必须 `HttpOnly`、生产环境 `Secure`、合适的 `SameSite`；写请求必须具备 CSRF 防护。
- 密码、Session Token、数据库凭据、第三方 Token 不得进入代码、Prompt、Artifact、前端包或普通日志。
- 登录失败响应不得泄露账号是否存在。

### 2.4 API 契约
- 所有 API 使用 `/api/v1` 前缀。
- 所有输入必须做 Schema Validation；错误结构统一；日期使用 ISO 8601；ID 使用 UUID。
- API 不得信任来自客户端的 `workspaceId`、`createdBy`、角色或权限字段。
- 项目列表必须分页；排序字段使用白名单。

### 2.5 数据库
- 所有 Schema 变更必须有版本化 Migration。
- 不得通过运行时 `db push` 代替正式 Migration。
- 不得在已有数据上执行破坏性重建或无备份的数据清理。
- 项目只能软归档；Phase 0–1 不实现物理删除。
- 新增索引、唯一约束和外键必须考虑现有数据与 Migration 可回滚性。

### 2.6 AI 与自动化边界
- Phase 0–1 不开发 Agent Runtime、外部工具调用、Shell Agent 或自动化业务操作。
- 不得通过假数据、硬编码统计值或静态演示记录伪装真实功能。
- 不得给尚未实现的导航入口配置看似可用的按钮。

## 3. 开发流程（每个 Issue 必须遵守）

1. 阅读任务文件和依赖任务交付物。
2. 检查 `git status --short`、相关代码、类型、API、Migration 和测试。
3. 写出计划：拟修改文件、兼容性风险、验证命令。
4. 实施最小必要改动，不顺手重构无关模块。
5. 增加或更新单元、集成和 E2E 测试。
6. 运行任务验收命令；若失败，修复或明确记录阻塞原因，不得谎报通过。
7. 更新相关文档、OpenAPI、Migration 说明和 Issue 状态。
8. 输出完成报告：变更文件、Migration、API、测试命令及结果、未完成项、风险。

## 4. Definition of Done

Issue 只有在以下条件全部满足时才能标记完成：

- 任务验收条件全部实现；
- 相关测试已新增并通过；
- `lint`、`typecheck`、`test` 通过；涉及构建的任务 `build` 通过；
- 数据库改动具有 Migration，且从空库可部署；
- 项目与 Workspace 作用域检查通过；
- 未泄露秘密或引入硬编码凭据；
- 文档和 API 契约已同步；
- 无未解释的 TODO、跳过测试或 `any` 扩散。

## 5. 代码质量

- TypeScript 使用 strict 模式；避免 `any`，无法避免时必须局部封装并注释原因。
- 领域规则放在服务/领域层，不把业务规则散落到页面组件或 HTTP Handler。
- API Handler 负责解析、认证、调用 Service 和映射响应，不直接堆积数据库逻辑。
- UI 使用明确的 loading、empty、error、success 状态；不以假数据填补空状态。
- 组件、API 和数据库字段命名保持一致，必要时在 DTO 层做明确映射。
- 所有关键业务状态转换必须由服务层校验。

## 6. 依赖与版本

- 先检查仓库现有 Node、包管理器和依赖版本。
- 新仓库采用任务包 `DECISIONS.md` 的基线；所有依赖必须写入 lockfile，不使用 `*` 或运行时下载 latest。
- 不得为一个简单功能引入重量级框架或重复依赖。
- 重大技术替换必须先新增 ADR 并获得负责人确认。

## 7. 任务并行规则

- 默认串行。
- 仅当 `SPRINT_PLAN.md` 标记可并行，且任务不会同时修改相同 Schema、路由注册、根配置或页面入口时，才允许并行。
- Migration、认证中间件、公共 API 契约和根配置任务原则上单 Agent 串行完成。

## 8. 完成报告格式

```text
Issue: <ID>
Status: DONE | BLOCKED | PARTIAL
Summary: ...
Changed files: ...
Database migrations: ...
API changes: ...
Tests executed: <command + pass/fail>
Manual verification: ...
Known limitations: ...
Follow-up issues: ...
```
