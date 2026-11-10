import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("password hashing", () => {
  it("uses a verifiable Argon2id password hash", async () => {
    const hash = await hashPassword("a-long-test-password-123");
    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(verifyPassword("a-long-test-password-123", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });
});
