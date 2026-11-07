# P1-05 — Project Domain Service & State Rules

**优先级**：P1  
**估算**：0.5–1 工程日  
**依赖**：P1-01  
**可并行**：可与 P1-04 有限并行；不得修改 Schema

## 1. 目标

实现项目领域类型、输入校验、Slug 生成和状态转换规则。业务规则应位于 Service/Domain 层，不依赖 HTTP Handler 或 React。

## 2. 输入文件（先读）

- Project/ProjectProfile ORM Model
- `packages/contracts/` 现有 Schema
- `DECISIONS.md` 项目字段与状态规则
- API 错误处理规范

## 3. 修改范围

建立：
- `ProjectType`：SINGLE_PRODUCT、VERTICAL_BRAND；
- `ProjectStatus`：DRAFT、ACTIVE、PAUSED、ARCHIVED；
- Create/Update DTO Schema；
- Slugify + 同 Workspace 唯一性处理（唯一冲突必须可重试生成后缀）；
- 项目状态转换 Service；
- Project Profile 字段校验。

创建项目最低必填：`name`、`projectType`、`initialIdea`。目标市场、预算、货币、商业模式、目标可选。预算金额必须大于等于零；预算货币须为三位代码；不得因没有预算而阻止项目创建。

状态规则严格遵守 `DECISIONS.md`。恢复 ARCHIVED 项目后进入 PAUSED。

## 4. 禁止事项

- 不得把 `projectId`、`workspaceId`、`createdBy` 作为客户端可更新字段。
- 不得接受任意状态字符串。
- 不得由 UI 自行决定状态合法性。
- 不得用 Float 计算金额。
- 不得在业务层依赖 Next.js 或 Fastify 类型。

## 5. 实施步骤

1. 定义领域枚举和 DTO。
2. 实现项目创建输入规范化。
3. 实现状态转换函数/Service。
4. 实现 slug 生成及唯一冲突处理。
5. 为边界条件、非法状态、空值和预算校验编写单测。

## 6. 验收标准

- [ ] 领域层可独立测试。
- [ ] 必填项缺失返回字段级校验错误。
- [ ] 合法状态转换通过，非法转换返回稳定错误码。
- [ ] 归档设置 archivedAt；恢复清空并设为 PAUSED。
- [ ] Slug 在同 Workspace 唯一，不要求全局唯一。
- [ ] DTO 不允许客户端赋值系统字段。

## 7. 验收命令

```bash
pnpm --filter @workspace/contracts test
pnpm --filter @workspace/api test -- project-domain
pnpm typecheck
```

## 8. 手工验证步骤

1. 创建名称相同的不同 Workspace 项目，确认可生成各自 slug。
2. 同 Workspace 创建重名项目，确认 slug 冲突会安全处理。
3. 尝试 ARCHIVED → ACTIVE，确认被拒绝；ARCHIVED → PAUSED 可成功。
4. 输入负预算或无效币种，确认校验失败。

## 9. 输出

Project DTO、Domain Service、状态机、Slug 规则与单测。
