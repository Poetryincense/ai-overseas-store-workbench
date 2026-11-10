import type { PrismaClient } from "./generated/prisma/client.js";
import { hashPassword } from "@workspace/shared";

export interface CreateOwnerInput {
  readonly email: string;
  readonly password: string;
  readonly displayName?: string;
  readonly workspaceName?: string;
}

export interface CreatedOwner {
  readonly userId: string;
  readonly workspaceId: string;
  readonly email: string;
}

const OWNER_BOOTSTRAP_LOCK = 1_213_486_164;

export async function createOwnerAccount(
  prisma: PrismaClient,
  input: CreateOwnerInput
): Promise<CreatedOwner> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("A valid owner email is required");
  }
  if (input.password.length < 12) {
    throw new Error("Owner password must be at least 12 characters");
  }

  const passwordHash = await hashPassword(input.password);
  const workspaceName = input.workspaceName?.trim() || "Personal Workspace";

  return prisma.$transaction(async (tx) => {
    // Serialize bootstrap attempts so two concurrent invocations cannot both
    // observe an empty owner table and create separate owners.
    await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(${OWNER_BOOTSTRAP_LOCK}, 1)) AS owner_lock`;

    const existingOwnerMembership = await tx.workspaceMember.count({
      where: { role: "OWNER" }
    });
    if (existingOwnerMembership > 0) {
      throw new Error("An owner is already initialized; refusing to overwrite it");
    }

    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        displayName: input.displayName?.trim() || null
      }
    });
    const workspace = await tx.workspace.create({
      data: { name: workspaceName, slug: "personal-workspace" }
    });
    await tx.workspaceMember.create({
      data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" }
    });

    return { userId: user.id, workspaceId: workspace.id, email: user.email };
  });
}
