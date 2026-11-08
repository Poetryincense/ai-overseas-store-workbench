export interface WorkspacePackageManifest {
  readonly name: string;
  readonly phase: "phase-0";
}

export const WORKSPACE_PACKAGES: readonly WorkspacePackageManifest[] = [
  { name: "@workspace/workbench", phase: "phase-0" },
  { name: "@workspace/api", phase: "phase-0" },
  { name: "@workspace/worker", phase: "phase-0" },
  { name: "@workspace/database", phase: "phase-0" },
  { name: "@workspace/contracts", phase: "phase-0" },
  { name: "@workspace/shared", phase: "phase-0" },
  { name: "@workspace/config", phase: "phase-0" }
] as const;

export * from "./env.js";
