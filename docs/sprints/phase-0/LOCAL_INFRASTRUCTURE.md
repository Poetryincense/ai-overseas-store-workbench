# LOCAL_INFRASTRUCTURE.md — P0-04 Local Infrastructure (PostgreSQL + Redis)

**Issue**: P0-04 — Local Infrastructure (PostgreSQL + Redis)  
**Date**: 2026-11-08  
**Status**: `PARTIAL` — static artifacts complete and statically validated; runtime health checks `BLOCKED` (no Docker in current environment).

---

## 1. 目标与产物

为本地开发建立可重复启动的 PostgreSQL 与 Redis 基础设施。Phase 0 只提供基础服务与健康检查，不实现队列业务。

产物清单：
- `infra/docker/compose.yaml`：PostgreSQL 16.4 + Redis 7.2.5 服务定义
- `.env.example`：环境变量示例（非真实值）
- `infra/docker/validate-compose.mjs`：无 Docker 环境下的静态校验脚本
- `.gitignore`：忽略真实 `.env`（保留 `.env.example`）

---

## 2. 服务与固定版本

| 服务 | 镜像（固定标签） | 端口绑定 | 持久化 volume | 健康检查 |
|---|---|---|---|---|
| PostgreSQL | `postgres:16.4` | `127.0.0.1:5432` | `postgres_data` → `/var/lib/postgresql/data` | `pg_isready` |
| Redis | `redis:7.2.5` | `127.0.0.1:6379` | `redis_data` → `/data`（AOF 持久化） | `redis-cli ping` |

- 镜像标签为固定主/次/补丁版本，不使用 `latest`。
- 端口仅绑定本机回环地址 `127.0.0.1`，不暴露到 `0.0.0.0` 或公网。
- Redis 启用 AOF（`--appendonly yes`）用于开发用途的持久化。

---

## 3. 环境变量

根目录 `.env.example` 提供示例值；复制为 `.env` 后按需替换：

```bash
POSTGRES_DB=workbench
POSTGRES_USER=workbench
POSTGRES_PASSWORD=change-me-local-only
DATABASE_URL=postgresql://workbench:change-me-local-only@127.0.0.1:5432/workbench
REDIS_URL=redis://127.0.0.1:6379
```

- `POSTGRES_*` 由 Compose 的 `postgres` 服务读取。
- `DATABASE_URL`、`REDIS_URL` 供应用（`apps/api`、`apps/worker`）使用。
- `POSTGRES_PASSWORD` 在 Compose 中为必填（`:?` 校验），未提供时启动会失败并提示，避免静默弱密码。
- 真实 `.env` 已被 `.gitignore` 忽略，严禁提交。

---

## 4. 启动 / 健康检查 / 停止

> 需要 Docker 与 Compose 可用。当前执行环境无 Docker，以下命令为运行手册（runtime runbook），运行时验收待 Docker 可用后补验。

### 4.1 准备环境变量

```bash
cp .env.example .env
# 编辑 .env，替换示例密码
```

### 4.2 启动服务

```bash
docker compose -f infra/docker/compose.yaml up -d postgres redis
```

### 4.3 查看状态与健康检查

```bash
docker compose -f infra/docker/compose.yaml ps
docker compose -f infra/docker/compose.yaml exec -T postgres pg_isready
docker compose -f infra/docker/compose.yaml exec -T redis redis-cli ping
```

预期：PostgreSQL 返回 `accepting connections`；Redis 返回 `PONG`。

### 4.4 停止（不删除持久化数据）

```bash
docker compose -f infra/docker/compose.yaml down
```

`down` 不会删除命名 volume，数据保留。

### 4.5 完全清理（需负责人明确授权）

```bash
docker compose -f infra/docker/compose.yaml down -v
```

`-v` 会删除 `postgres_data` 与 `redis_data` 数据卷，仅在有明确授权时执行。

---

## 5. 静态校验（无 Docker 环境）

```bash
node infra/docker/validate-compose.mjs
```

该校验脚本使用 `yaml` 库解析 `compose.yaml`，并断言：
- YAML 可解析为对象；
- `postgres`、`redis` 服务存在；
- 镜像使用固定标签（非 `latest`）；
- 端口仅绑定 `127.0.0.1`；
- 每个服务定义了 `healthcheck` 与持久化 `volume`；
- 命名 volume `postgres_data`、`redis_data` 已定义。

---

## 6. 验收状态

| 验收项 | 状态 | 说明 |
|---|---|---|
| Compose 配置可解析 | `PASS`（静态） | 通过 `validate-compose.mjs`（yaml 解析 + 结构断言） |
| PostgreSQL / Redis 启动后 healthy | `BLOCKED` | 当前环境无 Docker，无法执行运行时健康检查 |
| 应用可通过 URL 连接 | `BLOCKED` | 依赖运行时验证 |
| 端口不对外网开放 | `PASS`（静态） | Compose 端口仅绑定 `127.0.0.1` |
| `down` 不删除持久化数据 | `PASS`（配置） | 数据保存在命名 volume，`down` 不带 `-v` 不删除 |
| `.env` 不进入 Git | `PASS` | `.gitignore` 已忽略 `.env`，仅保留 `.env.example` |

**运行时验收阻塞项**：当前环境 `docker` / `docker compose` / `podman` / `colima` / `brew` 均 `UNAVAILABLE`。待具备 Docker 后需补验：`up -d`、`ps`、`pg_isready`、`redis-cli ping`、`down`（数据保留验证）。
