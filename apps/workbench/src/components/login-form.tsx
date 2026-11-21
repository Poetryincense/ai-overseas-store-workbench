"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { AuthRequestError, login } from "../lib/auth-client";
import { describeLoginFailure, validateLoginForm, type LoginFormErrors } from "../lib/auth-form";

type SubmitState = "idle" | "submitting" | "error";

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submittingRef.current) {
      return;
    }

    const errors = validateLoginForm({ email, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSubmitState("error");
      setFormError(null);
      return;
    }

    submittingRef.current = true;
    setSubmitState("submitting");
    setFormError(null);
    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      const status = error instanceof AuthRequestError ? error.status : 0;
      setPassword("");
      setSubmitState("error");
      setFormError(describeLoginFailure(status));
      submittingRef.current = false;
    }
  }

  const isSubmitting = submitState === "submitting";

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
      <div>
        <label htmlFor="login-email">邮箱</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          disabled={isSubmitting}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={fieldErrors.email !== undefined}
          aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
        />
        {fieldErrors.email ? <p id="login-email-error">{fieldErrors.email}</p> : null}
      </div>
      <div>
        <label htmlFor="login-password">密码</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          disabled={isSubmitting}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={fieldErrors.password !== undefined}
          aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
        />
        {fieldErrors.password ? <p id="login-password-error">{fieldErrors.password}</p> : null}
      </div>
      {formError ? (
        <p role="alert" id="login-form-error">
          {formError}
        </p>
      ) : null}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
