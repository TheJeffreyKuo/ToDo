import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../lib/password.js";

describe("password", () => {
  it("hashes and verifies a password", async () => {
    const plain = "correct horse battery staple";
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    expect(await verifyPassword(plain, hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });
});
