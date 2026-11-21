"use client";

export default function AppError({
  reset
}: {
  error: Error;
  reset: () => void;
}): React.JSX.Element {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <p role="alert">无法验证登录状态，请稍后重试。</p>
      <button type="button" onClick={reset}>
        重试
      </button>
    </main>
  );
}
