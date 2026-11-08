import { describe, expect, it } from "vitest";
import { CONTRACTS_BASE_PATH, type HealthStatusContract } from "./index.js";

describe("@workspace/contracts", () => {
  it("binds contracts base path to /api/v1", () => {
    const sample: HealthStatusContract = {
      service: "api",
      status: "ok"
    };
    expect(CONTRACTS_BASE_PATH).toBe("/api/v1");
    expect(sample.status).toBe("ok");
  });
});
