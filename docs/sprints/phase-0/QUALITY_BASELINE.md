# QUALITY_BASELINE.md — P0-03 Quality & Test Toolchain

**Issue**: P0-03 — Quality & Test Toolchain  
**Date**: 2026-11-08  
**Status**: `DONE`

---

## 1. 工具链与固定版本基线（符合 D-002 / D-009 / D-022）

所有质量与测试依赖均以精确版本写入 `package.json` 及 `pnpm-lock.yaml`（无 `*`、`latest`、`^`、`~`）：

| 工具 | 包名 | 固定版本 | 职责 |
|---|---|---|---|
| TypeScript | `typescript` | `5.9.3` | 全仓 `strict: true` 静态类型检查与构建（包含 `src/**/*.test.ts`） |
| ESLint | `eslint` / `@eslint/js` | `9.39.5` | 统一 Flat Config (`eslint.config.mjs`)，启用 `--max-warnings=0` |
| TypeScript ESLint | `typescript-eslint` | `8.72.1` | 严格 TypeScript Lint 规则（禁止显式 `any`、未使用变量报错） |
| React / Next ESLint | `eslint-plugin-react-hooks` / `@next/eslint-plugin-next` | `7.1.1` / `15.5.29` | 针对 `apps/workbench/**/*.{ts,tsx}` 启用 React Hooks 与 Next.js 规则 |
| Prettier | `prettier` | `3.9.10` | 全仓代码与配置文件统一格式化检查 (`format` / `format:check`) |
| Vitest | `vitest` | `3.2.7` | 单元与集成测试运行器（`passWithNoTests: false`） |
| V8 Coverage | `@vitest/coverage-v8` | `3.2.7` | V8 原生代码覆盖率统计（输出 `text`、`json-summary`、`lcov`） |

---

## 2. 根目录统一脚本（Root Scripts）

### 2.1 质量与构建主命令
- `pnpm lint`：`pnpm -r run lint`（对全部 7 个子包执行 `eslint src --max-warnings=0`）
- `pnpm format`：`prettier --write "**/*.{ts,tsx,mts,mjs,json,md,yml,yaml}"`
- `pnpm format:check`：`prettier --check "**/*.{ts,tsx,mts,mjs,json,md,yml,yaml}"`
- `pnpm typecheck`：`pnpm --filter "./packages/*" run build && pnpm -r run typecheck`
- `pnpm test`：`vitest run`
- `pnpm test:watch`：`vitest watch`
- `pnpm test:coverage`：`vitest run --coverage`
- `pnpm build`：`pnpm -r run build`
- `pnpm verify`：`pnpm run lint && pnpm run format:check && pnpm run typecheck && pnpm run test && pnpm run build`

### 2.2 预留 Phase 1 命令（未接入前显式报错退出，绝不伪造成功）
- `pnpm test:integration` → 输出 `[RESERVED]` 提示并以 `exit 1` 退出（将在 P1-02 / P1-06 接入）
- `pnpm test:e2e` → 输出 `[RESERVED]` 提示并以 `exit 1` 退出（将在 P1-09 接入）
- `pnpm db:generate` → 输出 `[RESERVED]` 提示并以 `exit 1` 退出（将在 P1-01 接入）
- `pnpm db:migrate:dev` → 输出 `[RESERVED]` 提示并以 `exit 1` 退出（将在 P1-01 接入）
- `pnpm db:migrate:deploy` → 输出 `[RESERVED]` 提示并以 `exit 1` 退出（将在 P1-01 接入）
- `pnpm db:migrate:status` → 输出 `[RESERVED]` 提示并以 `exit 1` 退出（将在 P1-01 接入）

---

## 3. 故障注入验证记录（证明检查器真实生效且正确传递非零退出码）

在 `packages/shared/src/fault-probe.test.ts` 中分别注入四类故障并实际运行根命令，验证完成后已删除临时故障文件并还原工作区：

1. **测试失败注入（`expect(1 + 1).toBe(3)`）**
   - 执行命令：`pnpm test`
   - 实际结果：`FAIL packages/shared/src/fault-probe.test.ts > AssertionError: expected 2 to be 3`，进程以 `Exit code 1` 失败退出。
2. **Lint 错误注入（`export const brokenLintAndType: any = "unformatted";`）**
   - 执行命令：`pnpm lint`
   - 实际结果：`1:38 error Unexpected any. Specify a different type @typescript-eslint/no-explicit-any`，进程以 `Exit code 1` 失败退出。
3. **格式错误注入（多余空格与未格式化代码）**
   - 执行命令：`pnpm format:check`
   - 实际结果：`[warn] packages/shared/src/fault-probe.test.ts Code style issues found in the above file`，进程以 `Exit code 1` 失败退出。
4. **TypeScript 类型错误注入（`export const brokenTypeAssignment: number = "not-a-number";`）**
   - 执行命令：`pnpm typecheck`
   - 实际结果：`src/fault-probe.test.ts(2,14): error TS2322: Type 'string' is not assignable to type 'number'`，进程以 `Exit code 2` 失败退出（同时证明 `.test.ts` 文件已纳入 TypeScript 严格类型检查）。

---

## 4. 验收命令真实执行结果

还原故障注入后，全量验收命令实际执行结果如下：

| 命令 | 实际结果摘要 | 状态 |
|---|---|---|
| `pnpm lint` | 7 个 workspace 子包全部通过 ESLint (`--max-warnings=0`) | `PASS` |
| `pnpm format:check` | `All matched files use Prettier code style!` | `PASS` |
| `pnpm typecheck` | 4 个 `packages/*` 构建声明 + 7 个子包 `tsc --noEmit` 全部通过 | `PASS` |
| `pnpm test` | `Test Files 7 passed (7)`，`Tests 8 passed (8)` | `PASS` |
| `pnpm test:coverage` | V8 覆盖率报告生成成功（7 个子包 Stmts/Branch/Funcs/Lines 均为 100%） | `PASS` |
| `pnpm build` | 7 个 workspace 子包全部成功编译输出 `dist/` | `PASS` |
| `pnpm verify` | 顺序执行 `lint` → `format:check` → `typecheck` → `test` → `build` 全部通过 | `PASS` |
