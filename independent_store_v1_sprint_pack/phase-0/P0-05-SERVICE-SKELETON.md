# P0-05 — Service Skeleton & Health Checks

**优先级**：P0  
**估算**：0.5–1 工程日  
**依赖**：P0-02、P0-03  
**可并行**：否；应用入口由一个 Agent 统一协调

## 1. 目标

建立 Workbench、API、Worker 最小可运行骨架，完成存活/就绪健康检查和结构化日志。此阶段不实现业务 API。

## 2. 输入文件（先读）

- `apps/workbench/`、`apps/api/`、`apps/worker/`
- 根 scripts 与 workspace 配置
- `packages/shared/`、`packages/config/`
- `.env.example`、Compose 文件

## 3. 修改范围

### Workbench
- Next.js 最小 App Router 页面，首页明确显示系统名称和 Phase 0 状态。
- 不显示模拟项目、模拟订单或虚构统计。

### API
- 新仓库优先 Fastify。
- `GET /health/live`：进程存活，不依赖 DB。
- `GET /health/ready`：验证所需依赖（至少 PostgreSQL）；Redis 若被配置为必需则一并检查。
- 健康接口不返回连接串、版本秘密或内部异常堆栈。

### Worker
- 可独立启动并输出 ready 日志。
- 暂不消费业务任务、不连接模型、不执行 Shell。
- 提供优雅关闭处理。

### 日志
- JSON 结构化日志；含 timestamp、level、service、requestId（API 请求）。
- 不记录密码、Cookie、Authorization Header 或完整连接串。

## 4. 禁止事项

- 不得在健康接口暴露环境变量。
- 不得让 Workbench 直接连接数据库。
- 不得在 Worker 中实现 Agent、调度或任务队列。
- 不得用 `setTimeout` 循环模拟生产调度。
- 不得把所有服务合并成单一无法独立启动的进程。

## 5. 实施步骤

1. 创建或复用服务入口。
2. 配置环境校验与安全默认值。
3. 实现 health endpoints 和健康状态类型。
4. 配置结构化日志和 request id。
5. 配置 graceful shutdown。
6. 更新 root scripts：`dev`、`dev:api`、`dev:worker`、`dev:workbench`（名称可按现有习惯映射）。

## 6. 验收标准

- [ ] Workbench 页面可访问。
- [ ] API live 与 ready 检查语义正确。
- [ ] 关闭 PostgreSQL 后 ready 失败，但 live 仍成功。
- [ ] Worker 可启动、输出 ready 并能正常退出。
- [ ] 日志不含秘密。
- [ ] 三个进程可独立运行。

## 7. 验收命令

```bash
pnpm dev:api
# 另一个终端
curl -fsS http://localhost:4000/health/live
curl -fsS http://localhost:4000/health/ready
pnpm dev:worker
pnpm dev:workbench
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

端口和脚本名若不同，以仓库文档中的实际映射为准。

## 8. 手工验证步骤

1. 在 PG 正常时调用 ready，确认 200。
2. 停止 PG，再调用 ready，确认非 2xx；live 仍为 200。
3. 检查日志中没有环境变量明文。
4. 启动和关闭 Worker，确认无残留进程。

## 9. 输出

三个最小服务入口、health endpoints、日志配置和启动命令文档。
