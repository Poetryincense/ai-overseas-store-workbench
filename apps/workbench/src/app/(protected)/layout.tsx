import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SYSTEM_NAME } from "@workspace/shared";
import { LogoutButton } from "../../components/logout-button";
import { getCurrentIdentity } from "../../lib/server-api";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children
}: {
  children: ReactNode;
}): Promise<React.JSX.Element> {
  const identity = await getCurrentIdentity();
  if (identity === null) {
    redirect("/login");
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "1rem 2rem",
          borderBottom: "1px solid #e5e7eb"
        }}
      >
        <div>
          <strong>{SYSTEM_NAME}</strong>
          <span style={{ marginLeft: "1rem" }}>{identity.workspace.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span>{identity.user.displayName ?? identity.user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main style={{ padding: "2rem" }}>{children}</main>
    </div>
  );
}
