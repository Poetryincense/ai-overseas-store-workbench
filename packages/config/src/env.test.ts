import { describe, expect, it } from "vitest";
import { loadEnv } from "./env.js";

describe("loadEnv", () => {
  it("defaults the Workbench origin to the local development origin", () => {
    expect(loadEnv({}).webOrigin).toBe("http://localhost:3000");
  });

  it("accepts only a canonical HTTP(S) origin", () => {
    expect(loadEnv({ WEB_ORIGIN: "https://workbench.example.test" }).webOrigin).toBe(
      "https://workbench.example.test"
    );
    expect(() => loadEnv({ WEB_ORIGIN: "https://workbench.example.test/path" })).toThrow(
      "WEB_ORIGIN must be a canonical http(s) origin without a path"
    );
  });
});
