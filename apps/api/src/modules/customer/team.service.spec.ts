import assert from "node:assert/strict";
import { test } from "node:test";

import { TeamService } from "./team.service.js";

test("team list is tenant-scoped and paginated", async () => {
  const service = new TeamService(
    {
      $transaction: async (queries: Promise<unknown>[]) => Promise.all(queries),
      user: {
        findMany: async (args: { where: unknown; take: number }) => {
          assert.deepEqual(args.where, {
            tenantId: "tenant-a",
            domain: "CUSTOMER",
            roles: { some: { tenantId: "tenant-a", role: { name: "STAFF" } } },
          });
          assert.equal(args.take, 10);
          return [];
        },
        count: async () => 0,
      },
    } as never,
    {} as never,
    {} as never,
  );
  assert.deepEqual(
    await service.list("tenant-a", {
      role: "STAFF",
      page: "1",
      pageSize: "10",
    }),
    { items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 },
  );
});

test("team update protects the tenant owner", async () => {
  const service = new TeamService(
    {
      user: {
        findFirstOrThrow: async () => ({
          roles: [{ role: { name: "OWNER" } }],
        }),
      },
    } as never,
    {} as never,
    {} as never,
  );
  await assert.rejects(
    () => service.update("tenant-a", "owner-a", { role: "STAFF" }),
    /Tenant owner is protected/,
  );
});

test("invitation role allowlist prevents internal role escalation", async () => {
  const service = new TeamService(
    {
      user: { findFirst: async () => null },
      invitation: { findFirst: async () => null },
      role: {
        findUnique: async () => null,
      },
    } as never,
    {} as never,
    {} as never,
  );
  await assert.rejects(
    () =>
      service.invite("tenant-a", "admin-a", {
        email: "staff@example.com",
        firstName: "Staff",
        lastName: "User",
        role: "STAFF",
      }),
    /Role cannot be assigned/,
  );
});
