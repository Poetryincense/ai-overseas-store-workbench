export const SYSTEM_NAME = "AI 海外独立站工作台" as const;
export const API_PREFIX = "/api/v1" as const;

export interface ServiceMetadata {
  readonly service: "workbench" | "api" | "worker";
  readonly version: string;
}
