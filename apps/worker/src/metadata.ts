import type { HealthStatusContract } from "@workspace/contracts";
import type { ServiceMetadata } from "@workspace/shared";

export const WORKER_METADATA: ServiceMetadata = {
  service: "worker",
  version: "0.1.0"
};

export function getWorkerBootstrapStatus(): HealthStatusContract {
  return {
    service: WORKER_METADATA.service,
    status: "ok"
  };
}
