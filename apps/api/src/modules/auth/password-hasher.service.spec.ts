import assert from "node:assert/strict";
import { test } from "node:test";

import { PasswordHasherService } from "./password-hasher.service.js";

test("password hashing never returns the plaintext and verifies correctly", async () => {
  const service = new PasswordHasherService();
  const hash = await service.hash("correct horse battery staple");

  assert.notEqual(hash, "correct horse battery staple");
  assert.equal(
    await service.verify(hash, "correct horse battery staple"),
    true,
  );
  assert.equal(await service.verify(hash, "wrong password"), false);
});
