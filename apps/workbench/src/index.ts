import { SYSTEM_NAME, type ServiceMetadata } from "@workspace/shared";

export const WORKBENCH_METADATA: ServiceMetadata = {
  service: "workbench",
  version: "0.1.0"
};

export function getWorkbenchBanner(): string {
  return `${SYSTEM_NAME} (${WORKBENCH_METADATA.service}@${WORKBENCH_METADATA.version})`;
}
