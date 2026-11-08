import { describe, expect, it } from "vitest";
import { WORKSPACE_PACKAGES } from "./index.js";

describe("@workspace/config", () => {
  it("lists all 7 canonical D-021 workspace packages", () => {
    const names = WORKSPACE_PACKAGES.map((pkg) => pkg.name);
    expect(names).toEqual([
      "@workspace/workbench",
      "@workspace/api",
      "@workspace/worker",
      "@workspace/database",
      "@workspace/contracts",
      "@workspace/shared",
      "@workspace/config"
    ]);
  });
});
