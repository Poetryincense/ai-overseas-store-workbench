# 环境兼容与真实执行规则

## 1. 核心原则

**验收目标优先于固定命令。**

工程任务中写出的命令用于表达验证目标。AI 应根据真实环境选择语义等价的兼容命令。

但：

> 兼容替代 ≠ 跳过验证。

## 2. Git 兼容示例

### 验证当前分支

新 Git：

```bash
git branch --show-current
```

旧 Git：

```bash
git symbolic-ref --short HEAD
```

Detached HEAD：

```bash
git rev-parse --short HEAD
```

验收目标是：

> 知道当前执行上下文所处的分支或明确记录 detached HEAD。

## 3. 命令不可用时的处理

按以下顺序：

### A. 尝试等价命令

例如 Git 版本不同导致子命令不存在。

### B. 判断是否影响任务本身

例如：

- Docker 不可用不会阻塞 P0-02；
- pnpm 不可用可能阻塞 Monorepo 初始化；
- 无 Shell 环境会阻塞真实工程实施。

### C. 明确状态

使用：

- `DONE`
- `PARTIAL`
- `BLOCKED`

禁止为了继续流程把 `BLOCKED` 伪装成 `DONE`。

## 4. 真实执行边界

GitHub API、代码浏览器或文件读取能力不能替代：

```bash
git status --short
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

如果工具没有实际 Shell：

- 可以审阅代码；
- 可以生成文件；
- 可以提交文件（如果有仓库写入能力）；

但不能声称已经完成本地工程验证。

## 5. 工具版本策略

不因为单个旧版本立即要求升级。

只有当版本差异影响：

- 数据正确性；
- 安全性；
- 依赖安装；
- 工程兼容性；
- 验收真实性；

时，才将任务标记为阻塞或提出升级。

## 6. 版本锁定原则

项目依赖版本必须固定：

- 根 `package.json` 固定 `packageManager`；
- `.npmrc` 使用 `save-exact=true`；
- 直接依赖不使用 `*`、`latest`、`^`、`~`；
- 提交 `pnpm-lock.yaml`；
- CI 使用冻结 lockfile 安装。

如果 lockfile 的间接依赖包含范围表达，不得手工破坏 lockfile；以实际解析和锁定结果为准。
