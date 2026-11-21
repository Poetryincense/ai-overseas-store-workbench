import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

loadDotenv({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

const API_PORT = 4000;
const WEB_PORT = 3000;
const WEB_ORIGIN = `http://localhost:${WEB_PORT}`;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for E2E tests (set it in the repository root .env)");
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: WEB_ORIGIN,
    trace: "retain-on-failure",
    channel: process.env.PLAYWRIGHT_CHANNEL
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: [
    {
      command: "node ../api/dist/index.js",
      url: `http://127.0.0.1:${API_PORT}/health/live`,
      reuseExistingServer: false,
      env: {
        ...process.env,
        NODE_ENV: "test",
        PORT: String(API_PORT),
        WEB_ORIGIN,
        AUTH_LOGIN_RATE_LIMIT_MAX: "50"
      } as Record<string, string>
    },
    {
      command: `pnpm exec next start --port ${WEB_PORT}`,
      url: WEB_ORIGIN,
      reuseExistingServer: false,
      env: {
        ...process.env,
        API_INTERNAL_URL: `http://127.0.0.1:${API_PORT}`
      } as Record<string, string>
    }
  ]
});
