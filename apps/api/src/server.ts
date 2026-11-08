import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import { Pool } from "pg";
import type { AppEnv } from "@workspace/config";
import type { Logger } from "@workspace/shared";

export interface BuildServerOptions {
  readonly env: AppEnv;
  readonly logger: Logger;
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

  return app;
}
