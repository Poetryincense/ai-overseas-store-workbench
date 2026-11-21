export class AuthRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthRequestError";
    this.status = status;
  }
}

interface CsrfResponseBody {
  readonly data?: { readonly csrfToken?: unknown };
}

async function fetchCsrfToken(): Promise<string> {
  const response = await fetch("/api/v1/auth/csrf", {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin"
  });
  if (!response.ok) {
    throw new AuthRequestError(response.status, "CSRF token request failed");
  }
  const body = (await response.json()) as CsrfResponseBody;
  const token = body.data?.csrfToken;
  if (typeof token !== "string" || token.length === 0) {
    throw new AuthRequestError(response.status, "CSRF token response was invalid");
  }
  return token;
}

export async function login(email: string, password: string): Promise<void> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch("/api/v1/auth/login", {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken
    },
    body: JSON.stringify({ email, password })
  });
  if (!response.ok) {
    throw new AuthRequestError(response.status, "Login failed");
  }
}

export async function logout(): Promise<void> {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch("/api/v1/auth/logout", {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
    headers: { "X-CSRF-Token": csrfToken }
  });
  if (!response.ok) {
    throw new AuthRequestError(response.status, "Logout failed");
  }
}
