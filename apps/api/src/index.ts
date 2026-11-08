import { loadEnv } from "@workspace/config";
import { createLogger } from "@workspace/shared";
import { buildServer } from "./server.js";

const env = loadEnv();
const logger = createLogger("api");

async function main(): Promise<void> {
  const app = buildServer({ env, logger });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info("shutting down", { signal });
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  await app.listen({ host: env.host, port: env.port });
  logger.info("api started", { host: env.host, port: env.port });
}

void main();
