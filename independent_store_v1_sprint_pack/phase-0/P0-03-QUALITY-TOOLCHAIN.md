# P0-03 — Quality & Test Toolchain

**优先级**：P0  
**估算**：0.5–1 工程日  
**依赖**：P0-02  
**可并行**：与 P0-04 可并行；根 scripts 变更需协调

## 1. 目标

为全仓建立一致的格式、Lint、TypeScript 类型检查和单元测试工具链，并提供根目录统一命令。

## 2. 输入文件（先读）

- `package.json`、workspace package manifests
- 所有 `tsconfig*.json`
- 现有 ESLint/Prettier/Vitest 配置
- `docs/sprints/phase-0/BASELINE_AUDIT.md`

## 3. 修改范围

新仓库按审计结果选择兼容版本，配置：
- ESLint（TypeScript + React/Next 规则）
- Prettier
- TypeScript strict
- Vitest
- 基础覆盖率配置
- 最小示例单元测试

根脚本至少提供：

```json
{
  "lint": "...",
  "format:check": "...",
  "typecheck": "...",
  "test": "...",
  "test:watch": "...",
  "build": "...",
  "verify": "..."
}
```

`verify` 至少顺序执行 lint、format:check、typecheck、test、build；若某个 workspace 暂无对应任务，必须安全跳过并在脚本中明确，不允许静默成功。

根脚本还需预留统一命令名称：`test:integration`、`test:e2e`、`db:generate`、`db:migrate:dev`、`db:migrate:deploy`、`db:migrate:status`。这些命令可在对应 Phase 1 Issue 中接入真实实现；未接入前不得伪装成已通过的检查。

## 4. 禁止事项

- 不得为通过检查而关闭整个规则集。
- 不得在根脚本中使用 `|| true` 掩盖失败。
- 不得将测试文件从 TypeScript 检查中全部排除。
- 不得用空测试替代实际断言。
- 不得在本任务中实现业务逻辑。

## 5. 实施步骤

1. 建立共享 lint/format/tsconfig 基线。
2. 对每个 app/package 配置正确的 extends 和 include/exclude。
3. 添加至少一个纯函数单测和一个测试失败示例验证测试运行器确实工作（失败示例验证后删除）。
4. 增加根 scripts。
5. 将命令执行结果记录到 `docs/sprints/phase-0/QUALITY_BASELINE.md`。

## 6. 验收标准

- [ ] strict TypeScript 生效。
- [ ] lint、format check、typecheck、test、build 命令存在。
- [ ] 示例测试确实会被发现和执行。
- [ ] 故意制造 lint/type/test 错误时命令能失败（验证后还原）。
- [ ] 无禁用全局规则或伪造测试通过。

## 7. 验收命令

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm verify
```

## 8. 手工验证步骤

1. 查看各 workspace 的 TypeScript strict 设置。
2. 查看测试报告，确认实际执行用例数大于 0（纯配置包除外）。
3. 抽查一次格式检查能识别故意引入的格式问题，然后还原。
4. 确认根脚本退出码能正确传递失败。

## 9. 输出

共享工具配置、根脚本、示例测试和 `QUALITY_BASELINE.md`。
