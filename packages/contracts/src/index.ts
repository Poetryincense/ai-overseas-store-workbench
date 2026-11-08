import { API_PREFIX } from "@workspace/shared";

export interface HealthStatusContract {
  readonly status: "ok" | "degraded" | "unhealthy";
  readonly service: "workbench" | "api" | "worker";
}

export const CONTRACTS_BASE_PATH = API_PREFIX;
