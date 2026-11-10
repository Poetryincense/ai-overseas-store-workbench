import { randomUUID } from "node:crypto";
import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AppEnv } from "@workspace/config";
import { createPrismaClient } from "@workspace/database";
import { hashPassword, type Logger } from "@workspace/shared";
import { hashSessionToken } from "./auth-service.js";
import { buildServer } from "./server.js";

loadDotenv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });
if (!process.env.DATABASE_URL) {
  loadDotenv({ path: fileURLToPath(new URL("../../../packages/database/.env", import.meta.url)) });
}

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined || databaseUrl === "") {
  throw new Error("DATABASE_URL is required for Auth API integration tests");
}

const prisma = createPrismaClient(databaseUrl);
const suffix = randomUUID();
const email = `auth-${suffix}@example.test`;
const password = "correct-horse-battery-staple-1";
const webOrigin = "http://localhost:3000";
const env: AppEnv = {
  nodeEnv: "test",
  host: "127.0.0.1",
  port: 4000,
  webOrigin,
  databaseUrl,
  redisUrl: undefined
};
const logger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined
};

let userId = "";
let workspaceId = "";

function buildApp(appEnv = env) {
  return buildServer({ env: appEnv, logger, prisma });
}

async function getCsrf(app: ReturnType<typeof buildApp>): Promise<string> {
  const response = await app.inject({ method: "GET", url: "/api/v1/auth/csrf" });
  expect(response.statusCode).toBe(200);
  expect(response.headers["cache-control"]).toBe("no-store");
  return response.json<{ data: { csrfToken: string } }>().data.csrfToken;
}

function csrfRequest(token: string) {
  return {
    headers: {
      origin: webOrigin,
      cookie: `workbench_csrf=${token}`,
      "x-csrf-token": token
    }
  };
}

function setCookieValues(setCookie: string | string[] | number | undefined): string[] {
  return Array.isArray(setCookie) ? setCookie : typeof setCookie === "string" ? [setCookie] : [];
}

function sessionCookie(setCookie: string | string[] | number | undefined): string {
  const cookies = setCookieValues(setCookie);
  const session = cookies.find((value) => value.startsWith("workbench_session="));
  expect(session).toBeDefined();
  return session!.split(";", 1)[0]!;
}

beforeAll(async () => {
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, displayName: "Auth Test" }
  });
  userId = user.id;
  const workspace = await prisma.workspace.create({
    data: { name: `Auth Test ${suffix}`, slug: `auth-test-${suffix}` }
  });
  workspaceId = workspace.id;
  await prisma.workspaceMember.create({ data: { userId, workspaceId, role: "OWNER" } });
});

afterAll(async () => {
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.workspaceMember.deleteMany({ where: { userId } });
  if (workspaceId !== "") await prisma.workspace.delete({ where: { id: workspaceId } });
  if (userId !== "") await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("Auth API", () => {
  it("does not expose a public registration endpoint", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email, password }
    });
    expect(response.statusCode).toBe(404);
    await app.close();
  });

  it("returns 401 for missing credentials and does not reveal account existence", async () => {
    const app = buildApp();
    const csrfToken = await getCsrf(app);
    const base = csrfRequest(csrfToken);
    const existing = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      ...base,
      payload: { email, password: "wrong-password" }
    });
    const missing = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      ...base,
      payload: { email: `missing-${suffix}@example.test`, password: "wrong-password" }
    });
    expect(existing.statusCode).toBe(401);
    expect(missing.statusCode).toBe(401);
    expect(existing.json().error).toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password"
    });
    expect(missing.json().error).toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password"
    });
    await app.close();
  });

  it("requires matching CSRF cookie/header and exact Origin for writes", async () => {
    const app = buildApp();
    const csrfToken = await getCsrf(app);
    const withoutToken = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { origin: webOrigin },
      payload: { email, password }
    });
    const wrongOrigin = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { ...csrfRequest(csrfToken).headers, origin: "https://attacker.example" },
      payload: { email, password }
    });
    expect(withoutToken.statusCode).toBe(403);
    expect(wrongOrigin.statusCode).toBe(403);
    await app.close();
  });

  it("allows credentialed CORS only from the configured Workbench origin", async () => {
    const app = buildApp();
    const allowed = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/auth/login",
      headers: {
        origin: webOrigin,
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type,x-csrf-token"
      }
    });
    const rejected = await app.inject({
      method: "OPTIONS",
      url: "/api/v1/auth/login",
      headers: {
        origin: "https://attacker.example",
        "access-control-request-method": "POST"
      }
    });
    expect(allowed.headers["access-control-allow-origin"]).toBe(webOrigin);
    expect(allowed.headers["access-control-allow-credentials"]).toBe("true");
    expect(rejected.headers["access-control-allow-origin"]).toBe(webOrigin);
    expect(rejected.headers["access-control-allow-origin"]).not.toBe("https://attacker.example");
    await app.close();
  });

  it("sets HttpOnly, SameSite=Lax session cookie and rotates previous sessions", async () => {
    const app = buildApp();
    const csrfToken = await getCsrf(app);
    const firstLogin = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      ...csrfRequest(csrfToken),
      payload: { email: email.toUpperCase(), password }
    });
    expect(firstLogin.statusCode).toBe(200);
    const firstCookie = sessionCookie(firstLogin.headers["set-cookie"]);
    const firstSetCookie = setCookieValues(firstLogin.headers["set-cookie"]).join("; ");
    expect(firstSetCookie).toContain("HttpOnly");
    expect(firstSetCookie).toContain("SameSite=Lax");
    const rawSessionToken = firstCookie.split("=", 2)[1]!;
    const storedSession = await prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(rawSessionToken) }
    });
    expect(storedSession).not.toBeNull();
    expect(storedSession?.tokenHash).not.toBe(rawSessionToken);

    const secondCsrf = await getCsrf(app);
    const secondLogin = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      ...csrfRequest(secondCsrf),
      payload: { email, password }
    });
    const secondCookie = sessionCookie(secondLogin.headers["set-cookie"]);

    const oldSession = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { cookie: firstCookie }
    });
    const currentSession = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { cookie: secondCookie }
    });
    expect(oldSession.statusCode).toBe(401);
    expect(currentSession.statusCode).toBe(200);

    const meJson = JSON.stringify(currentSession.json());
    expect(meJson).toContain(email);
    expect(meJson).toContain("Auth Test");
    expect(meJson).not.toContain("passwordHash");
    expect(meJson).not.toContain(password);
    expect(meJson).not.toContain("workbench_session");

    const nextCsrf = secondLogin.json<{ data: { csrfToken: string } }>().data.csrfToken;
    const logout = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: {
        ...csrfRequest(nextCsrf).headers,
        cookie: `${secondCookie}; workbench_csrf=${nextCsrf}`
      }
    });
    expect(logout.statusCode).toBe(200);
    const afterLogout = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { cookie: secondCookie }
    });
    expect(afterLogout.statusCode).toBe(401);
    await app.close();
  });

  it("serializes concurrent logins so only one fresh session remains active", async () => {
    const app = buildApp();
    const csrfToken = await getCsrf(app);
    const payload = {
      method: "POST" as const,
      url: "/api/v1/auth/login",
      ...csrfRequest(csrfToken),
      payload: { email, password }
    };
    const responses = await Promise.all([app.inject(payload), app.inject(payload)]);
    expect(responses.every((response) => response.statusCode === 200)).toBe(true);
    const activeSessions = await prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } }
    });
    expect(activeSessions).toHaveLength(1);
    const identities = await Promise.all(
      responses.map((response) =>
        app.inject({
          method: "GET",
          url: "/api/v1/auth/me",
          headers: { cookie: sessionCookie(response.headers["set-cookie"]) }
        })
      )
    );
    expect(identities.filter((response) => response.statusCode === 200)).toHaveLength(1);
    expect(identities.filter((response) => response.statusCode === 401)).toHaveLength(1);
    await app.close();
  });

  it("rejects expired and revoked sessions and returns 401 for unauthenticated /me", async () => {
    const app = buildApp();
    const noSession = await app.inject({ method: "GET", url: "/api/v1/auth/me" });
    expect(noSession.statusCode).toBe(401);

    const expiredToken = `expired-${suffix}`;
    await prisma.session.create({
      data: {
        userId,
        tokenHash: hashSessionToken(expiredToken),
        expiresAt: new Date(Date.now() - 60_000)
      }
    });
    const expired = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { cookie: `workbench_session=${expiredToken}` }
    });
    expect(expired.statusCode).toBe(401);

    const revokedToken = `revoked-${suffix}`;
    await prisma.session.create({
      data: {
        userId,
        tokenHash: hashSessionToken(revokedToken),
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: new Date()
      }
    });
    const revoked = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: { cookie: `workbench_session=${revokedToken}` }
    });
    expect(revoked.statusCode).toBe(401);
    await app.close();
  });

  it("limits login attempts", async () => {
    const app = buildApp();
    const csrfToken = await getCsrf(app);
    const results = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      results.push(
        await app.inject({
          method: "POST",
          url: "/api/v1/auth/login",
          ...csrfRequest(csrfToken),
          payload: { email: `missing-${suffix}@example.test`, password: "wrong-password" }
        })
      );
    }
    expect(results.slice(0, 5).every((response) => response.statusCode === 401)).toBe(true);
    expect(results[5]?.statusCode).toBe(429);
    expect(results[5]?.json().error.code).toBe("RATE_LIMITED");
    await app.close();
  });

  it("sets Secure and __Host- cookies in production", async () => {
    const app = buildApp({
      ...env,
      nodeEnv: "production",
      webOrigin: "https://workbench.example.test"
    });
    const csrf = await app.inject({ method: "GET", url: "/api/v1/auth/csrf" });
    const token = csrf.json<{ data: { csrfToken: string } }>().data.csrfToken;
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: {
        origin: "https://workbench.example.test",
        cookie: `__Host-workbench_csrf=${token}`,
        "x-csrf-token": token
      },
      payload: { email, password }
    });
    expect(login.statusCode).toBe(200);
    const productionCookies = setCookieValues(login.headers["set-cookie"]).join("; ");
    expect(productionCookies).toContain("__Host-workbench_session=");
    expect(productionCookies).toContain("Secure");
    await app.close();
  });
});
