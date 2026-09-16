import assert from "node:assert/strict";
import { test } from "node:test";

import { AuthService } from "./auth.service.js";

test("login succeeds and returns tokens for the requested tenant", async () => {
  const service = new AuthService(
    {
      user: {
        findFirst: async (args: unknown) => {
          assert.deepEqual(args, {
            where: { email: "owner@example.com", tenantId: "tenant-a" },
          });
          return {
            id: "user-a",
            tenantId: "tenant-a",
            domain: "CUSTOMER",
            passwordHash: "hash",
          };
        },
        findUniqueOrThrow: async () => ({
          id: "user-a",
          tenantId: "tenant-a",
          domain: "CUSTOMER",
          roles: [
            {
              role: {
                name: "OWNER",
                permissions: [{ permission: { key: "users.read" } }],
              },
            },
          ],
        }),
      },
      refreshToken: { create: async () => undefined },
    } as never,
    { verify: async () => true } as never,
    {
      createRefreshToken: () => ({ value: "refresh-token", hash: "hash" }),
      accessToken: () => "access-token",
    } as never,
    { jwtRefreshExpiresIn: "7d" } as never,
  );

  const result = await service.login({
    email: "owner@example.com",
    password: "password123",
    tenantId: "tenant-a",
  });
  assert.equal(result.accessToken, "access-token");
  assert.equal(result.refreshToken, "refresh-token");
});

test("invalid login is rejected", async () => {
  const service = new AuthService(
    { user: { findFirst: async () => null } } as never,
    { verify: async () => false } as never,
    {} as never,
    {} as never,
  );

  await assert.rejects(
    () => service.login({ email: "owner@example.com", password: "wrong" }),
    /Invalid credentials/,
  );
});

test("tenant isolation rejects a user lookup from another tenant", async () => {
  const service = new AuthService(
    { user: { findFirst: async () => null } } as never,
    { verify: async () => true } as never,
    {} as never,
    {} as never,
  );

  await assert.rejects(
    () =>
      service.login({
        email: "owner@example.com",
        password: "password123",
        tenantId: "different-tenant",
      }),
    /Invalid credentials/,
  );
});
