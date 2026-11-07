# P0-02 — Monorepo Bootstrap

**优先级**：P0  
**估算**：0.5–1 工程日  
**依赖**：P0-01  
**可并行**：否（根配置独占）

## 1. 目标

在不破坏现有代码的前提下，建立统一的 TypeScript Monorepo 和应用/包边界。新仓库采用 pnpm workspace；已有仓库优先复用现有包管理器并在审计报告记录理由。

## 2. 输入文件（先读）

- `docs/sprints/phase-0/BASELINE_AUDIT.md`
- 根目录 `package.json`、lockfile、`.gitignore`、`.npmrc`、`pnpm-workspace.yaml`（存在时）
- `AGENTS.md`、`DECISIONS.md`

## 3. 修改范围

新仓库建议结构：

```text
apps/
  workbench/       # Next.js App Router
  api/             # Fastify API
  worker/          # 独立 Worker 进程骨架
packages/
  database/        # ORM 与 DB client，暂不建业务表
  contracts/       # Zod/JSON Schema/API DTO
  shared/          # 无副作用通用类型/工具
  config/          # TS、ESLint 等共享配置
infra/docker/
docs/architecture/
docs/adr/
docs/sprints/phase-0/
docs/sprints/phase-1/
```

创建或完善：
- root `package.json`
- `pnpm-workspace.yaml`
- `.gitignore`
- `.npmrc`（仅必要设置）
- 各 workspace package 的 `package.json`
- 应用最小入口与 README
- Node/包管理器版本约束文件（按审计结论选择）

根目录必须有统一 `name`、`private: true`、`packageManager` 固定值和 workspace scripts 占位。

## 4. 禁止事项

- 不得删除现有 app/package 或整体搬迁目录。
- 不得在多个 package 中重复安装相同基础依赖而无理由。
- 不得使用 `*` 版本范围。
- 不得创建 Phase 1 以外的业务功能。
- 不得新建 `storefront`、Shopify、Agent Runtime 等空壳业务模块；这些在后续 Phase 建设。

## 5. 实施步骤

1. 根据审计决定实际 Monorepo 路径映射。
2. 初始化或调整 workspace 配置。
3. 建立 `workbench`、`api`、`worker` 的最小启动入口。
4. 建立 `database`、`contracts`、`shared`、`config` 包边界。
5. 统一 package 命名、导入路径和 TypeScript project references（如确有必要）。
6. 生成并提交 lockfile。

## 6. 验收标准

- [ ] workspace 能识别全部 packages/apps。
- [ ] 每个 workspace 都有明确 package name。
- [ ] 根目录可统一安装依赖和运行 workspace 脚本。
- [ ] 没有循环依赖。
- [ ] 新增代码均可被 TypeScript 编译。
- [ ] 原有应用入口和用户数据没有丢失。

## 7. 验收命令

```bash
pnpm install --frozen-lockfile
pnpm -r list --depth -1
pnpm -r exec node -e "console.log('workspace-ok')"
```

如果审计确认现有仓库使用非 pnpm 包管理器，应执行映射后的等价命令，并在报告中说明。

## 8. 手工验证步骤

1. 删除本地 `node_modules` 后重新安装（不得删除 lockfile）。
2. 检查 workspace 列表与预期一致。
3. 分别确认 Workbench/API/Worker 的入口文件能被正确找到。
4. 检查 Git diff，确认未删除原有模块。

## 9. 输出

Monorepo 基础结构、依赖锁文件、workspace 配置和目录结构说明。
