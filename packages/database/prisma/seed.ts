import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { ProjectType, createPrismaClient } from "../src/index.js";

config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });
if (!process.env.DATABASE_URL) {
  config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });
}

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined || databaseUrl === "") {
  throw new Error("DATABASE_URL is required to seed the database");
}

const prisma = createPrismaClient(databaseUrl);

async function main(): Promise<void> {
  // 测试 seed：不含真实业务数据，幂等（upsert）。
  const workspace = await prisma.workspace.upsert({
    where: { slug: "seed-workspace" },
    update: {},
    create: { name: "Seed Workspace", slug: "seed-workspace" }
  });

  const project = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: "seed-project" } },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: "Seed Project",
      slug: "seed-project",
      projectType: ProjectType.SINGLE_PRODUCT
    }
  });

  await prisma.projectProfile.upsert({
    where: { projectId: project.id },
    update: {},
    create: {
      projectId: project.id,
      initialIdea: "Seed test project (not real business data)",
      targetMarket: "US",
      budgetAmount: "1000.00",
      budgetCurrency: "USD"
    }
  });

  console.log(`Seeded workspace=${workspace.id} project=${project.id}`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
