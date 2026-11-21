"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { logout } from "../lib/auth-client";
import { describeLogoutFailure } from "../lib/auth-form";

export function LogoutButton(): React.JSX.Element {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout(): Promise<void> {
    if (pendingRef.current) {
      return;
    }
    pendingRef.current = true;
    setIsPending(true);
    setError(null);
    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } catch {
      setError(describeLogoutFailure());
      setIsPending(false);
      pendingRef.current = false;
    }
  }

  return (
    <div>
      <button type="button" onClick={handleLogout} disabled={isPending}>
        {isPending ? "退出中…" : "退出登录"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
