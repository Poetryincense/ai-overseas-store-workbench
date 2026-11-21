import { cookies } from "next/headers";
import type { AuthIdentityDto } from "@workspace/contracts";

const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000";

export class ApiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiUnavailableError";
  }
}

interface IdentityResponseBody {
  readonly data?: AuthIdentityDto;
}

/**
 * Asks the API, the authority for sessions, who the current browser belongs to.
 * Returns null only when the API explicitly rejects the session (401).
 */
export async function getCurrentIdentity(): Promise<AuthIdentityDto | null> {
  const cookieHeader = (await cookies()).toString();
  if (cookieHeader === "") {
    return null;
  }

  let response: Response;
  try {
    response = await fetch(`${API_INTERNAL_URL}/api/v1/auth/me`, {
      headers: { cookie: cookieHeader, accept: "application/json" },
      cache: "no-store"
    });
  } catch {
    throw new ApiUnavailableError("Auth API is unreachable");
  }

  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw new ApiUnavailableError(`Auth API responded with ${response.status}`);
  }

  const body = (await response.json()) as IdentityResponseBody;
  if (body.data === undefined) {
    throw new ApiUnavailableError("Auth API returned an invalid identity payload");
  }
  return body.data;
}
