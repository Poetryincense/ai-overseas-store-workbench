import { CONTRACTS_BASE_PATH, type HealthStatusContract } from "@workspace/contracts";
import { getDatabasePackageDescriptor } from "@workspace/database";
import { type ServiceMetadata } from "@workspace/shared";

export const API_METADATA: ServiceMetadata = {
  service: "api",
  version: "0.1.0"
};

export function getApiBootstrapStatus(): HealthStatusContract & {
  readonly basePath: string;
  readonly databaseEngine: string;
} {
  const db = getDatabasePackageDescriptor();
  return {
    service: API_METADATA.service,
    status: "ok",
    basePath: CONTRACTS_BASE_PATH,
    databaseEngine: db.engine
  };
}
