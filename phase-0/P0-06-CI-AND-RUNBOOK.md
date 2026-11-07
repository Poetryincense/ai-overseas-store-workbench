# P0-06 — CI & Developer Runbook

**优先级**：P0  
**估算**：0.5–1 工程日  
**依赖**：P0-03、P0-04、P0-05  
**可并行**：否

## 1. 目标

建立可重复的 CI 检查，并让新开发者能从零启动本地环境。默认使用 GitHub Actions；已有 CI 平台则沿用。

## 2. 输入文件（先读）

- `.github/workflows/`（或现有 CI 配置）
- `package.json`、lockfile
- `README.md`、`infra/docker/compose.yaml`
- `docs/sprints/phase-0/QUALITY_BASELINE.md`

## 3. 修改范围

新增或更新 CI Pipeline：
1. Checkout。
2. 安装固定版本 Node 和 pnpm（版本来自仓库配置）。
3. 使用 frozen lockfile 安装依赖。
4. 执行 lint、format check、typecheck、test、build。
5. 对需要 DB 的测试启动 PostgreSQL/Redis service 或独立 job。

更新 `README.md` 和 `docs/runbooks/local-development.md`：
- 环境要求；
- 初始化环境变量；
- 启动/停止 PG、Redis；
- 安装依赖；
- 启动三个应用；
- 执行所有检查；
- 常见故障处理。

## 4. 禁止事项

- 不得在 CI 中使用真实生产密钥。
- 不得把测试失败设置为允许失败。
- 不得在 CI 中执行数据库数据清理到真实环境。
- 不得仅运行 lint 而跳过 typecheck/test/build。
- 不得使用可变 `latest` 版本。

## 5. 实施步骤

1. 配置 CI 环境和缓存。
2. 确保 lockfile 安装一致。
3. 配置需要服务依赖的测试 job。
4. 配置 PR 检查必过项（若仓库权限允许）。
5. 编写本地运行手册。
6. 实际触发一次 CI 并记录链接/结果。

## 6. 验收标准

- [ ] CI 在干净环境成功安装依赖。
- [ ] lint、format、typecheck、test、build 全部运行。
- [ ] 有意让某项测试失败时 CI 会失败（通过临时分支验证后恢复）。
- [ ] README 的步骤可由另一名开发者复现。
- [ ] 没有真实 Secret 出现在仓库或 CI 日志。

## 7. 验收命令

```bash
pnpm install --frozen-lockfile
pnpm verify
docker compose -f infra/docker/compose.yaml config
```

CI 必须另行验证，不以本地命令替代。

## 8. 手工验证步骤

1. 从干净工作目录按 README 重新安装。
2. 启动服务并访问 Workbench 和 API health。
3. 检查 CI 运行记录中的所有 job。
4. 检查 CI 日志无敏感环境变量输出。

## 9. 输出

CI workflow、README、local-development runbook 和 G0 验收记录。
