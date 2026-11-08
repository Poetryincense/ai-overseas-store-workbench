import { SYSTEM_NAME } from "@workspace/shared";

export default function HomePage(): React.JSX.Element {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", lineHeight: 1.6 }}>
      <h1>{SYSTEM_NAME}</h1>
      <p>Phase 0 — 服务骨架已建立（Workbench / API / Worker）。</p>
      <p>当前阶段不展示模拟项目、订单或虚构统计。</p>
    </main>
  );
}
