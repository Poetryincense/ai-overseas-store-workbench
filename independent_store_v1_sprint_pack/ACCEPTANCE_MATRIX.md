# Phase 0–1 Acceptance Matrix

| ID | 场景 | 预期结果 | 自动化层级 | Gate |
|---|---|---|---|---|
| A0-01 | 在干净环境安装依赖 | lockfile 安装成功 | CI | G0 |
| A0-02 | 启动本地服务 | PostgreSQL、Redis healthy | Smoke | G0 |
| A0-03 | 启动应用 | Workbench/API/Worker 可启动 | Smoke | G0 |
| A0-04 | 质量检查 | lint/typecheck/test/build 全绿 | CI | G0 |
| A1-01 | 首次初始化 | 创建唯一 Owner 和 Workspace | Integration | G1 |
| A1-02 | 登录成功 | 设置有效 HttpOnly Session Cookie | API | G1 |
| A1-03 | 登录失败 | 不泄露账号是否存在；无 Session | API | G1 |
| A1-04 | 登出 | Session 撤销；Cookie 清除 | API | G1 |
| A1-05 | 未登录访问 | 页面跳转登录/API 返回 401 | E2E/API | G1 |
| A1-06 | 创建项目 | Project + Profile 在一个事务内创建 | Integration | G1 |
| A1-07 | 列表分页筛选 | 总数、分页、状态/类型筛选准确 | API | G1 |
| A1-08 | 项目详情 | 返回当前 Workspace 下项目 | API | G1 |
| A1-09 | 项目更新 | 仅允许白名单字段更新 | API | G1 |
| A1-10 | 状态转换 | 合法转换成功、非法转换 409 | Unit/API | G1 |
| A1-11 | 归档恢复 | 设置/清除 archivedAt；恢复为 PAUSED | API | G1 |
| A1-12 | 跨 Workspace 项目读取 | 返回统一 404，不泄露项目存在性 | Security Integration | G1 |
| A1-13 | Dashboard | 统计和最近项目与 DB 一致 | API/E2E | G1 |
| A1-14 | 双项目 UI | 项目 A、B 切换后资料不串 | E2E | G1 |
| A1-15 | 硬删除防护 | 不存在 Project DELETE 物理删除端点 | API contract | G1 |
