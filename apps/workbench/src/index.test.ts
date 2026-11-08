import { describe, expect, it } from "vitest";
import { WORKBENCH_METADATA, getWorkbenchBanner } from "./index.js";

describe("@workspace/workbench", () => {
  it("formats workbench banner with system name and version", () => {
    expect(WORKBENCH_METADATA.service).toBe("workbench");
    expect(getWorkbenchBanner()).toBe("AI 海外独立站工作台 (workbench@0.1.0)");
  });
});
