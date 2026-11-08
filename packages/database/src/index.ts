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
