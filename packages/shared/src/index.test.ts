import { describe, expect, it } from "vitest";
import { API_PREFIX, SYSTEM_NAME, buildApiPath } from "./index.js";

describe("@workspace/shared", () => {
  it("exposes baseline system name and API v1 prefix", () => {
    expect(SYSTEM_NAME).toBe("FAIL_PROBE_INTENTIONAL");
    expect(API_PREFIX).toBe("/api/v1");
  });

  it("normalizes relative segments into /api/v1 paths", () => {
    expect(buildApiPath("health")).toBe("/api/v1/health");
    expect(buildApiPath("/projects")).toBe("/api/v1/projects");
    expect(buildApiPath("   ")).toBe("/api/v1");
  });
});
