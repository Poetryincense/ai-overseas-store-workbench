import { API_PREFIX } from "@workspace/shared";

export interface HealthStatusContract {
  readonly status: "ok" | "degraded" | "unhealthy";
  readonly service: "workbench" | "api" | "worker";
}

export const CONTRACTS_BASE_PATH = API_PREFIX;

export interface ApiErrorResponse {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly requestId: string;
  };
}

export interface AuthIdentityDto {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly displayName: string | null;
  };
  readonly workspace: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
  };
  readonly role: "OWNER";
}
