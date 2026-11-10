import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

export const DATABASE_PACKAGE_NAME = "@workspace/database" as const;

export interface DatabasePackageDescriptor {
  readonly packageName: typeof DATABASE_PACKAGE_NAME;
  readonly engine: "postgresql";
}

export function getDatabasePackageDescriptor(): DatabasePackageDescriptor {
  return {
    packageName: DATABASE_PACKAGE_NAME,
    engine: "postgresql"
  };
}

export { PrismaClient } from "./generated/prisma/client.js";
export type {
  User,
  Workspace,
  WorkspaceMember,
  Session,
  Project,
  ProjectProfile
} from "./generated/prisma/client.js";
export * from "./generated/prisma/enums.js";
export { createOwnerAccount } from "./owner.js";
export type { CreateOwnerInput, CreatedOwner } from "./owner.js";

export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}
