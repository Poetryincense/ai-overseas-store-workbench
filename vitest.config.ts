import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const r = (relPath: string): string => fileURLToPath(new URL(relPath, import.meta.url));

export default defineConfig({
  root: r("."),
  resolve: {
    alias: {
      "@workspace/config": r("./packages/config/src/index.ts"),
      "@workspace/shared": r("./packages/shared/src/index.ts"),
      "@workspace/contracts": r("./packages/contracts/src/index.ts"),
      "@workspace/database": r("./packages/database/src/index.ts")
    }
  },
  test: {
    environment: "node",
    include: ["apps/**/src/**/*.test.ts", "packages/**/src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
    passWithNoTests: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      include: ["apps/**/src/**/*.ts", "packages/**/src/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.d.ts"]
    }
  }
});
