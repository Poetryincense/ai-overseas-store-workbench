import { describe, expect, it } from "vitest";
import { API_METADATA, getApiBootstrapStatus } from "./index.js";

describe("@workspace/api", () => {
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
