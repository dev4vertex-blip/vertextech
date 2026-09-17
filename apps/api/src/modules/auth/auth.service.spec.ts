import assert from "node:assert/strict";
import { test } from "node:test";

import { AuthService } from "./auth.service.js";

test("login succeeds and returns tokens for the requested tenant", async () => {
  const service = new AuthService(
    {
      user: {
        findMany: async (args: unknown) => {
          assert.deepEqual(args, {
            where: {
              email: "owner@example.com",
              tenant: { is: { slug: "tenant-a" } },
            },
          });
          return [
            {
              id: "user-a",
              tenantId: "tenant-a",
              domain: "CUSTOMER",
              passwordHash: "hash",
              status: "ACTIVE",
              emailVerifiedAt: new Date(),
            },
          ];
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
    { sendEmailVerification: async () => undefined } as never,
  );

  const result = await service.login({
    email: "owner@example.com",
    password: "password123",
    tenantSlug: "tenant-a",
  });
  assert.equal(result.accessToken, "access-token");
  assert.equal(result.refreshToken, "refresh-token");
});

test("invalid login is rejected", async () => {
  const service = new AuthService(
    { user: { findMany: async () => [] } } as never,
    { verify: async () => false } as never,
    {} as never,
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
    { user: { findMany: async () => [] } } as never,
    { verify: async () => true } as never,
    {} as never,
    {} as never,
    {} as never,
  );

  await assert.rejects(
    () =>
      service.login({
        email: "owner@example.com",
        password: "password123",
        tenantSlug: "different-tenant",
      }),
    /Invalid credentials/,
  );
});

test("customer login without a tenant slug is rejected", async () => {
  const service = new AuthService(
    {
      user: {
        findMany: async () => [
          {
            id: "user-a",
            tenantId: "tenant-a",
            domain: "CUSTOMER",
            passwordHash: "hash",
            status: "ACTIVE",
            emailVerifiedAt: new Date(),
          },
        ],
      },
    } as never,
    { verify: async () => true } as never,
    {} as never,
    {} as never,
    {} as never,
  );
  await assert.rejects(
    () =>
      service.login({
        email: "owner@example.com",
        password: "password123",
      }),
    /Invalid credentials/,
  );
});

test("disabled customers cannot login", async () => {
  const service = new AuthService(
    {
      user: {
        findMany: async () => [
          {
            id: "user-a",
            tenantId: "tenant-a",
            domain: "CUSTOMER",
            passwordHash: "hash",
            status: "SUSPENDED",
            emailVerifiedAt: new Date(),
          },
        ],
      },
    } as never,
    { verify: async () => true } as never,
    {} as never,
    {} as never,
    {} as never,
  );
  await assert.rejects(
    () =>
      service.login({
        email: "owner@example.com",
        password: "password123",
        tenantSlug: "tenant-a",
      }),
    /Invalid credentials/,
  );
});

test("registration creates a tenant owner and verification token transactionally", async () => {
  const calls: string[] = [];
  const service = new AuthService(
    {
      $transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          tenant: {
            create: async () => {
              calls.push("tenant");
              return { id: "tenant-a" };
            },
          },
          role: {
            findUniqueOrThrow: async () => ({ id: "owner-role" }),
          },
          user: {
            create: async () => {
              calls.push("user");
              return { id: "user-a" };
            },
          },
          userRole: {
            create: async () => {
              calls.push("owner-assignment");
            },
          },
          verificationToken: {
            create: async () => {
              calls.push("verification");
            },
          },
        }),
    } as never,
    { hash: async () => "password-hash" } as never,
    {} as never,
    {
      nodeEnv: "test",
      verificationTokenExpiresIn: "24h",
    } as never,
    { sendEmailVerification: async () => undefined } as never,
  );
  const result = await service.register({
    tenantName: "ABC Traders",
    tenantSlug: "abc-traders",
    email: "owner@example.com",
    password: "password123",
    firstName: "Owner",
    lastName: "A",
  });
  assert.deepEqual(result, {
    userId: "user-a",
    tenantId: "tenant-a",
    status: "PENDING_EMAIL_VERIFICATION",
  });
  assert.deepEqual(calls, [
    "tenant",
    "user",
    "owner-assignment",
    "verification",
  ]);
});

test("registration transaction errors do not issue a verification response", async () => {
  const service = new AuthService(
    {
      $transaction: async () => {
        throw new Error("role assignment failed");
      },
    } as never,
    { hash: async () => "password-hash" } as never,
    {} as never,
    { nodeEnv: "test", verificationTokenExpiresIn: "24h" } as never,
    { sendEmailVerification: async () => undefined } as never,
  );
  await assert.rejects(
    () =>
      service.register({
        tenantName: "ABC Traders",
        tenantSlug: "abc-traders",
        email: "owner@example.com",
        password: "password123",
        firstName: "Owner",
        lastName: "A",
      }),
    /role assignment failed/,
  );
});

test("invitation acceptance creates the invited tenant user and role atomically", async () => {
  let accepted = false;
  const service = new AuthService(
    {
      invitation: {
        findFirst: async () => ({
          id: "invitation-a",
          tenantId: "tenant-a",
          invitedEmail: "staff@example.com",
          firstName: "Staff",
          lastName: "User",
          roleId: "role-staff",
          expiresAt: new Date(Date.now() + 60_000),
          role: { name: "STAFF", scope: "TENANT" },
        }),
      },
      user: { findFirst: async () => null },
      $transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          user: {
            create: async () => ({
              id: "user-staff",
              tenantId: "tenant-a",
            }),
          },
          userRole: { create: async () => undefined },
          invitation: {
            update: async () => {
              accepted = true;
            },
          },
        }),
    } as never,
    { hash: async () => "password-hash" } as never,
    {} as never,
    {} as never,
    {} as never,
  );
  assert.deepEqual(
    await service.acceptInvitation("a".repeat(32), "password123"),
    { userId: "user-staff", tenantId: "tenant-a", role: "STAFF" },
  );
  assert.equal(accepted, true);
});
