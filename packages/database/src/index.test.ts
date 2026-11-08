import { describe, expect, it } from "vitest";
import { DATABASE_PACKAGE_NAME, getDatabasePackageDescriptor } from "./index.js";

describe("@workspace/database", () => {
  it("returns postgresql package descriptor", () => {
    expect(getDatabasePackageDescriptor()).toEqual({
      packageName: DATABASE_PACKAGE_NAME,
      engine: "postgresql"
    });
  });
});
