import { describe, expect, it } from "vitest";
import { WORKER_METADATA, getWorkerBootstrapStatus } from "./metadata.js";

describe("@workspace/worker", () => {
  it("reports worker bootstrap status", () => {
    expect(WORKER_METADATA.service).toBe("worker");
    expect(getWorkerBootstrapStatus()).toEqual({
      service: "worker",
      status: "ok"
    });
  });
});
