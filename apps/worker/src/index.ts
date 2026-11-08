import { createLogger } from "@workspace/shared";
import { WORKER_METADATA } from "./metadata.js";

const logger = createLogger("worker");

function main(): void {
  logger.info("worker ready", {
    service: WORKER_METADATA.service,
    version: WORKER_METADATA.version
  });

  const shutdown = (signal: string): void => {
    logger.info("worker shutting down", { signal });
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Phase 0: no business tasks, no scheduler, no queue. This idle interval
  // only keeps the event loop alive until a termination signal is received.
  setInterval(() => {}, 60_000);
}

main();
