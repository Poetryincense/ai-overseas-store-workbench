import { describe, expect, it } from "vitest";
import type { AppEnv } from "@workspace/config";
import { createLogger } from "@workspace/shared";
import { API_METADATA, getApiBootstrapStatus } from "./metadata.js";
import { buildServer } from "./server.js";

const testEnv: AppEnv = {
  nodeEnv: "test",
  host: "127.0.0.1",
  port: 4000,
  databaseUrl: undefined,
  redisUrl: undefined
};

describe("@workspace/api metadata", () => {
  it("reports api bootstrap status with /api/v1 base path and postgresql engine", () => {
    expect(API_METADATA.service).toBe("api");
    expect(getApiBootstrapStatus()).toEqual({
      service: "api",
      status: "ok",
      basePath: "/api/v1",
      databaseEngine: "postgresql"
    });
  });
});

describe("@workspace/api health endpoints", () => {
  it("GET /health/live returns 200 without a database", async () => {
    const app = buildServer({ env: testEnv, logger: createLogger("api-test") });
    const response = await app.inject({ method: "GET", url: "/health/live" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", service: "api" });
    await app.close();
  });

  it("GET /health/ready returns 503 when database is unavailable", async () => {
    const app = buildServer({ env: testEnv, logger: createLogger("api-test") });
    const response = await app.inject({ method: "GET", url: "/health/ready" });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      status: "unhealthy",
      service: "api",
      checks: { database: "down" }
    });
    await app.close();
  });

  it("sets an X-Request-Id header on responses", async () => {
    const app = buildServer({ env: testEnv, logger: createLogger("api-test") });
    const response = await app.inject({ method: "GET", url: "/health/live" });
    expect(response.headers["x-request-id"]).toBeDefined();
    await app.close();
  });
});
