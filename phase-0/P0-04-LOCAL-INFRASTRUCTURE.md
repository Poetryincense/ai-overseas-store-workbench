# P0-04 — Local Infrastructure (PostgreSQL + Redis)

**优先级**：P0  
**估算**：0.5 工程日  
**依赖**：P0-02  
**可并行**：与 P0-03 可并行

## 1. 目标

建立可重复启动的本地开发基础设施：PostgreSQL 和 Redis。Phase 0 只提供服务与健康检查，不实现队列业务。

## 2. 输入文件（先读）

- `infra/docker/`（现有 Docker 配置）
- `docker-compose.yml` / `compose.yaml`（如存在）
- `.env.example`、`.gitignore`
- `docs/sprints/phase-0/BASELINE_AUDIT.md`

## 3. 修改范围

创建或更新 `infra/docker/compose.yaml`（若仓库已有 Compose 文件，沿用现有位置并在文档映射）。服务：
- PostgreSQL：持久化 volume、healthcheck、仅绑定本机地址。
- Redis：持久化策略按开发用途设置、healthcheck、仅绑定本机地址。

环境变量至少包含：
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `REDIS_URL`

根 `.env.example` 必须提供非真实示例值；真实 `.env` 必须 Git ignore。

## 4. 禁止事项

- 不得把数据库端口暴露到公网或 `0.0.0.0`。
- 不得提交真实密码、Token 或生产连接串。
- 不得用 `latest` 镜像标签；固定经过验证的主/次版本标签。
- 不得在本任务实现 Worker 队列、缓存业务或数据模型。
- 不得删除现有 volume；清理数据必须先获负责人明确授权。

## 5. 实施步骤

1. 检查 Docker 与 Compose 版本和现有服务。
2. 建立 PostgreSQL、Redis service、volume、healthcheck。
3. 设置仅本机端口绑定；使用独立本地开发账号。
4. 完善 `.env.example` 与 `.gitignore`。
5. 在 README/runbook 中说明启动、健康检查、停止方式。

## 6. 验收标准

- [ ] Compose 配置可解析。
- [ ] PostgreSQL 与 Redis 启动后健康状态为 healthy。
- [ ] 应用可通过容器网络或本机 URL 连接。
- [ ] 端口不对外网开放。
- [ ] `docker compose down` 不删除持久化数据；除非显式指定清理命令。
- [ ] `.env` 不进入 Git。

## 7. 验收命令

```bash
docker compose -f infra/docker/compose.yaml config
docker compose -f infra/docker/compose.yaml up -d postgres redis
docker compose -f infra/docker/compose.yaml ps
docker compose -f infra/docker/compose.yaml exec -T postgres pg_isready
docker compose -f infra/docker/compose.yaml exec -T redis redis-cli ping
```

预期 PostgreSQL 返回 accepting connections，Redis 返回 `PONG`。

## 8. 手工验证步骤

1. 确认服务端口只绑定 `127.0.0.1`。
2. 停止并重新启动服务，检查数据 volume 仍存在。
3. 检查 `git status --short`，确认 `.env` 未被跟踪。

## 9. 输出

Compose 文件、环境变量示例和本地基础设施运行说明。
