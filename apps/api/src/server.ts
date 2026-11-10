import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import { Pool } from "pg";
import type { AppEnv } from "@workspace/config";
import { createPrismaClient, type PrismaClient } from "@workspace/database";
import type { Logger } from "@workspace/shared";
import { registerAuthRoutes } from "./auth-routes.js";

export interface BuildServerOptions {
  readonly env: AppEnv;
  readonly logger: Logger;
  readonly prisma?: PrismaClient;
}

const DATABASE_CHECK_TIMEOUT_MS = 2000;

async function checkDatabase(databaseUrl: string | undefined): Promise<boolean> {
  if (databaseUrl === undefined || databaseUrl === "") {
    return false;
  }
  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: DATABASE_CHECK_TIMEOUT_MS
  });
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await pool.end();
  }
}

export function buildServer(options: BuildServerOptions): FastifyInstance {
  const { env, logger } = options;
  const ownsPrisma = options.prisma === undefined && Boolean(env.databaseUrl);
  const prisma =
    options.prisma ?? (env.databaseUrl ? createPrismaClient(env.databaseUrl) : undefined);

  const app = Fastify({
    logger: false,
    genReqId: () => randomUUID()
  });

  app.addHook("onRequest", (request, reply, done) => {
    reply.header("X-Request-Id", request.id);
    done();
  });

  app.addHook("onResponse", (request, reply, done) => {
    logger.info("request completed", {
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode
    });
    done();
  });

  app.setErrorHandler((error, request, reply) => {
    const errorDetails =
      typeof error === "object" && error !== null
        ? (error as { validation?: unknown; statusCode?: unknown })
        : {};
    const validationError = errorDetails.validation !== undefined;
    const errorStatus = typeof errorDetails.statusCode === "number" ? errorDetails.statusCode : 500;
    const statusCode = validationError ? 400 : errorStatus < 500 ? errorStatus : 500;
    const rateLimited = statusCode === 429;
    logger.error("request failed", { requestId: request.id, statusCode });
    reply.code(statusCode).send({
      error: {
        code: validationError
          ? "VALIDATION_ERROR"
          : rateLimited
            ? "RATE_LIMITED"
            : statusCode === 500
              ? "INTERNAL_ERROR"
              : "REQUEST_ERROR",
        message: validationError
          ? "Invalid request"
          : rateLimited
            ? "Too many login attempts; try again later"
            : statusCode === 500
              ? "Internal server error"
              : "Request failed",
        requestId: request.id
      }
    });
  });

  app.get("/health/live", async () => ({
    status: "ok",
    service: "api"
  }));

  app.get("/health/ready", async (_request, reply) => {
    const databaseReady = await checkDatabase(env.databaseUrl);
    if (!databaseReady) {
      reply.code(503);
      return { status: "unhealthy", service: "api", checks: { database: "down" } };
    }
    return { status: "ok", service: "api", checks: { database: "up" } };
  });

  app.register(async (authScope) => {
    await registerAuthRoutes(authScope, { env, prisma });
  });

  if (prisma !== undefined && ownsPrisma) {
    app.addHook("onClose", async () => {
      await prisma.$disconnect();
    });
  }

  return app;
}
