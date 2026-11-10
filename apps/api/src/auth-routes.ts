import { randomBytes, timingSafeEqual } from "node:crypto";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { PrismaClient } from "@workspace/database";
import type { AppEnv } from "@workspace/config";
import { createAuthService } from "./auth-service.js";

const COOKIE_TTL_SECONDS = 7 * 24 * 60 * 60;
const CSRF_HEADER = "x-csrf-token";

export interface AuthRouteOptions {
  readonly env: AppEnv;
  readonly prisma: PrismaClient | undefined;
}

function cookieNames(production: boolean): { session: string; csrf: string } {
  return production
    ? { session: "__Host-workbench_session", csrf: "__Host-workbench_csrf" }
    : { session: "workbench_session", csrf: "workbench_csrf" };
}

function errorBody(requestId: string, code: string, message: string) {
  return { error: { code, message, requestId } };
}

function tokensMatch(cookieToken: string | undefined, headerToken: string | undefined): boolean {
  if (cookieToken === undefined || headerToken === undefined) return false;
  const cookieBytes = Buffer.from(cookieToken);
  const headerBytes = Buffer.from(headerToken);
  return cookieBytes.length === headerBytes.length && timingSafeEqual(cookieBytes, headerBytes);
}

function setCsrfCookie(reply: FastifyReply, env: AppEnv, token: string): void {
  const names = cookieNames(env.nodeEnv === "production");
  reply.setCookie(names.csrf, token, {
    path: "/",
    httpOnly: false,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: COOKIE_TTL_SECONDS
  });
}

export async function registerAuthRoutes(
  app: FastifyInstance,
  options: AuthRouteOptions
): Promise<void> {
  const { env, prisma } = options;
  const names = cookieNames(env.nodeEnv === "production");
  const auth = prisma === undefined ? undefined : createAuthService(prisma);

  app.addHook("onRequest", (_request, reply, done) => {
    reply.header("Cache-Control", "no-store");
    done();
  });

  await app.register(cookie);
  await app.register(cors, {
    origin: env.webOrigin,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token"]
  });
  await app.register(rateLimit, { global: false });

  const requireCsrf = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (request.headers.origin !== env.webOrigin) {
      reply.code(403).send(errorBody(request.id, "CSRF_REJECTED", "Request origin rejected"));
      return;
    }
    if (
      !tokensMatch(request.cookies[names.csrf], request.headers[CSRF_HEADER] as string | undefined)
    ) {
      reply.code(403).send(errorBody(request.id, "CSRF_REJECTED", "CSRF validation failed"));
    }
  };

  app.get("/api/v1/auth/csrf", async (request, reply) => {
    const csrfToken = randomBytes(32).toString("base64url");
    setCsrfCookie(reply, env, csrfToken);
    return { data: { csrfToken } };
  });

  app.post<{ Body: { email: string; password: string } }>(
    "/api/v1/auth/login",
    {
      preHandler: requireCsrf,
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 15 * 60 * 1000,
          errorResponseBuilder: (request, context) =>
            Object.assign(new Error("Too many login attempts; try again later"), {
              statusCode: context.statusCode,
              requestId: request.id
            })
        }
      },
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["email", "password"],
          properties: {
            email: { type: "string", minLength: 3, maxLength: 320 },
            password: { type: "string", minLength: 1, maxLength: 1024 }
          }
        }
      }
    },
    async (request, reply) => {
      if (auth === undefined) {
        reply.code(503);
        return errorBody(request.id, "SERVICE_UNAVAILABLE", "Authentication service unavailable");
      }
      const session = await auth.login(request.body.email, request.body.password);
      if (session === null) {
        reply.code(401);
        return errorBody(request.id, "INVALID_CREDENTIALS", "Invalid email or password");
      }

      reply.setCookie(names.session, session.token, {
        path: "/",
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "lax",
        maxAge: COOKIE_TTL_SECONDS
      });
      const csrfToken = randomBytes(32).toString("base64url");
      setCsrfCookie(reply, env, csrfToken);
      const identity = await auth.getIdentity(session.token);
      return { data: { ...identity, csrfToken } };
    }
  );

  app.post("/api/v1/auth/logout", { preHandler: requireCsrf }, async (request, reply) => {
    if (auth === undefined) {
      reply.code(503);
      return errorBody(request.id, "SERVICE_UNAVAILABLE", "Authentication service unavailable");
    }
    await auth.logout(request.cookies[names.session]);
    reply.clearCookie(names.session, {
      path: "/",
      secure: env.nodeEnv === "production",
      sameSite: "lax"
    });
    reply.clearCookie(names.csrf, {
      path: "/",
      secure: env.nodeEnv === "production",
      sameSite: "lax"
    });
    return { data: { success: true } };
  });

  app.get("/api/v1/auth/me", async (request, reply) => {
    if (auth === undefined) {
      reply.code(503);
      return errorBody(request.id, "SERVICE_UNAVAILABLE", "Authentication service unavailable");
    }
    const identity = await auth.getIdentity(request.cookies[names.session]);
    if (identity === null) {
      reply.code(401);
      return errorBody(request.id, "UNAUTHENTICATED", "Authentication required");
    }
    return { data: identity };
  });
}
