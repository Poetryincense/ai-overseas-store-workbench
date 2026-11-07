# START HERE — 新 AI 编码工具首次启动说明

## 0. 先判断你是否真的具备工程执行能力

在修改任何文件前，确认：

- [ ] 能访问目标 Git 仓库
- [ ] 能读取仓库文件
- [ ] 能修改仓库文件
- [ ] 能执行 Shell/终端命令
- [ ] 能看到命令真实输出
- [ ] 能执行 Node.js
- [ ] 能执行 pnpm，或能够在允许范围内安装/启用指定版本

如果前 5 项中任意一项为否：

> 停止工程实施，不得标记 P0-02 DONE。

## 1. 当前项目性质

这是 Greenfield 项目：

- 没有旧业务代码；
- 不需要迁移旧系统；
- 不需要导入 agent-autoloop；
- P0-02 的目标是直接建立规定的 Monorepo 工程基线。

## 2. 首次环境检查

根据当前工具版本选择兼容命令，至少验证：

### 仓库根目录

优先：

```bash
git rev-parse --show-toplevel
```

### 当前分支

优先：

```bash
git branch --show-current
```

如果 Git 不支持，则：

```bash
git symbolic-ref --short HEAD
```

如果处于 detached HEAD，则记录：

```bash
git rev-parse --short HEAD
```

### 最新提交

```bash
git log -1 --oneline
```

### 工作区状态

```bash
git status --short
```

### 工具版本

```bash
git --version
node --version
pnpm --version
docker --version
docker compose version
```

命令不存在时必须记录 `UNAVAILABLE`，不得伪造成功。

## 3. 允许继续的条件

### 可以继续 P0-02

至少满足：

- 仓库可读写；
- Shell 可执行；
- Git 可执行；
- Node.js 可执行；
- pnpm 已可用，或任务允许在不破坏环境的前提下启用固定版本。

### Docker 不可用

Docker 不可用不一定阻塞 P0-02。

但会阻塞或影响：

- P0-04 Local Infrastructure；
- G0 完整验收。

应将状态标记为 `PARTIAL` 或 `BLOCKED`，而不是停止全部工程。

## 4. Greenfield P0-02 目标

P0-02 必须建立：

```text
apps/
├── workbench/
├── api/
└── worker/

packages/
├── database/
├── contracts/
├── shared/
└── config/
```

并建立：

```text
package.json
pnpm-workspace.yaml
pnpm-lock.yaml
.npmrc
```

包名严格使用 D-021。

## 5. 不允许的行为

禁止：

```bash
git reset --hard
git clean -fd
```

禁止：

- 删除现有 Sprint 文档；
- 覆盖 `AGENTS.md`；
- 伪造 lockfile；
- 报告未实际运行的命令；
- 因为一个非关键命令版本不兼容而无故停止；
- 未经验证就声称 P0-02 完成。

## 6. 推荐主控执行方式

一次只执行一个 Issue。

完成后：

1. 运行验收；
2. 输出报告；
3. 等待审核；
4. 不自行进入下一 Issue。
