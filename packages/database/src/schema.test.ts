import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { createPrismaClient, ProjectStatus, ProjectType } from "./index.js";

config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined || databaseUrl === "") {
  throw new Error("DATABASE_URL is required for schema tests");
}

const prisma = createPrismaClient(databaseUrl);
const SUFFIX = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function createUser(email: string): Promise<string> {
  const user = await prisma.user.create({
    data: { email, passwordHash: "not-a-real-hash" }
  });
  return user.id;
}

async function createWorkspace(slug: string): Promise<string> {
  const ws = await prisma.workspace.create({ data: { name: `ws-${slug}`, slug } });
  return ws.id;
}

afterAll(async () => {
  await prisma.projectProfile.deleteMany({
    where: { project: { workspace: { slug: { startsWith: `test-${SUFFIX}` } } } }
  });
  await prisma.project.deleteMany({
    where: { workspace: { slug: { startsWith: `test-${SUFFIX}` } } }
  });
  await prisma.workspaceMember.deleteMany({
    where: { user: { email: { endsWith: `@${SUFFIX}.test` } } }
  });
  await prisma.session.deleteMany({
    where: { user: { email: { endsWith: `@${SUFFIX}.test` } } }
  });
  await prisma.workspace.deleteMany({ where: { slug: { startsWith: `test-${SUFFIX}` } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `@${SUFFIX}.test` } } });
  await prisma.$disconnect();
});

describe("P1-01 schema constraints", () => {
  it("rejects duplicate user email", async () => {
    const email = `owner-${SUFFIX}@${SUFFIX}.test`;
    await createUser(email);
    await expect(createUser(email)).rejects.toThrow();
  });

  it("rejects duplicate workspace slug", async () => {
    const slug = `test-${SUFFIX}-ws`;
    await createWorkspace(slug);
    await expect(createWorkspace(slug)).rejects.toThrow();
  });

  it("enforces one workspace per user (unique user_id on workspace_members)", async () => {
    const email = `member-${SUFFIX}@${SUFFIX}.test`;
    const userId = await createUser(email);
    const ws1 = await createWorkspace(`test-${SUFFIX}-m1`);
    const ws2 = await createWorkspace(`test-${SUFFIX}-m2`);

    await prisma.workspaceMember.create({
      data: { workspaceId: ws1, userId }
    });
    await expect(
      prisma.workspaceMember.create({ data: { workspaceId: ws2, userId } })
    ).rejects.toThrow();
  });

  it("rejects duplicate project slug within the same workspace", async () => {
    const ws = await createWorkspace(`test-${SUFFIX}-p`);
    const data = {
      workspaceId: ws,
      name: "Project A",
      slug: "project-a",
      projectType: ProjectType.SINGLE_PRODUCT
    };
    await prisma.project.create({ data });
    await expect(prisma.project.create({ data })).rejects.toThrow();
  });

  it("enforces one-to-one relationship between project and profile", async () => {
    const ws = await createWorkspace(`test-${SUFFIX}-prof`);
    const project = await prisma.project.create({
      data: {
        workspaceId: ws,
        name: "Project B",
        slug: "project-b",
        projectType: ProjectType.VERTICAL_BRAND
      }
    });

    await prisma.projectProfile.create({
      data: { projectId: project.id, initialIdea: "sell widgets" }
    });
    await expect(
      prisma.projectProfile.create({
        data: { projectId: project.id, initialIdea: "another idea" }
      })
    ).rejects.toThrow();
  });

  it("rejects foreign key to non-existent workspace", async () => {
    await expect(
      prisma.project.create({
        data: {
          workspaceId: "00000000-0000-0000-0000-000000000000",
          name: "Orphan",
          slug: `orphan-${SUFFIX}`,
          projectType: ProjectType.SINGLE_PRODUCT
        }
      })
    ).rejects.toThrow();
  });

  it("stores budget as precise decimal (12,2)", async () => {
    const ws = await createWorkspace(`test-${SUFFIX}-dec`);
    const project = await prisma.project.create({
      data: {
        workspaceId: ws,
        name: "Project C",
        slug: "project-c",
        projectType: ProjectType.SINGLE_PRODUCT
      }
    });
    const profile = await prisma.projectProfile.create({
      data: {
        projectId: project.id,
        initialIdea: "budgeted project",
        budgetAmount: "12345.67",
        budgetCurrency: "USD"
      }
    });
    expect(profile.budgetAmount?.toString()).toBe("12345.67");
    expect(profile.budgetCurrency).toBe("USD");
  });

  it("defaults project status to DRAFT", async () => {
    const ws = await createWorkspace(`test-${SUFFIX}-status`);
    const project = await prisma.project.create({
      data: {
        workspaceId: ws,
        name: "Project D",
        slug: "project-d",
        projectType: ProjectType.SINGLE_PRODUCT
      }
    });
    expect(project.status).toBe(ProjectStatus.DRAFT);
  });
});
