import { redirect } from "next/navigation";
import { SYSTEM_NAME } from "@workspace/shared";
import { LoginForm } from "../../components/login-form";
import { ApiUnavailableError, getCurrentIdentity } from "../../lib/server-api";

export const dynamic = "force-dynamic";

export default async function LoginPage(): Promise<React.JSX.Element> {
  let identity = null;
  try {
    identity = await getCurrentIdentity();
  } catch (error) {
    if (!(error instanceof ApiUnavailableError)) {
      throw error;
    }
  }
  if (identity !== null) {
    redirect("/dashboard");
  }

  return (
    <main style={{ maxWidth: "24rem", margin: "4rem auto", padding: "0 1rem" }}>
      <h1>登录</h1>
      <p>{SYSTEM_NAME}</p>
      <LoginForm />
    </main>
  );
}
