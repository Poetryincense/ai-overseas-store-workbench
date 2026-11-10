import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

loadDotenv({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });
if (!process.env.DATABASE_URL) {
  loadDotenv({ path: fileURLToPath(new URL("./.env", import.meta.url)) });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: process.env["DATABASE_URL"]
  }
});
