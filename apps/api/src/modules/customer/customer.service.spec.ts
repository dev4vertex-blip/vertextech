import assert from "node:assert/strict";
import { test } from "node:test";

import { CustomerService } from "./customer.service.js";

test("customer profile is constrained by authenticated user and tenant", async () => {
  const service = new CustomerService({
    user: {
      findFirst: async (args: unknown) => {
        assert.deepEqual(args, {
          where: { id: "user-a", tenantId: "tenant-a", domain: "CUSTOMER" },
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            status: true,
            tenant: {
              select: { id: true, name: true, slug: true, status: true },
            },
            roles: {
              where: { tenantId: "tenant-a" },
              select: { role: { select: { name: true, scope: true } } },
            },
          },
        });

        test("dashboard and team summary use only the authenticated tenant", async () => {
          const service = new CustomerService({
            tenant: {
              findFirstOrThrow: async (args: unknown) => {
                assert.deepEqual(args.where, {
                  id: "tenant-a",
                  status: "ACTIVE",
                  users: { some: { id: "user-a" } },
                });
                return { id: "tenant-a", _count: { users: 2 } };
              },
            },
            user: {
              groupBy: async (args: unknown) => {
                assert.deepEqual(args, {
                  by: ["status"],
                  where: { tenantId: "tenant-a", domain: "CUSTOMER" },
                  _count: { _all: true },
                });
                return [
                  { status: "ACTIVE", _count: { _all: 1 } },
                  { status: "SUSPENDED", _count: { _all: 1 } },
                ];
              },
            },
          } as never);
          await service.dashboard("user-a", "tenant-a");
          assert.deepEqual(await service.teamSummary("tenant-a"), {
            totalUsers: 2,
            activeUsers: 1,
            inactiveUsers: 1,
          });
        });

        test("business and settings queries are tenant-scoped", async () => {
          const service = new CustomerService({
            tenant: {
              findUniqueOrThrow: async (args: unknown) => {
                assert.deepEqual(args.where, { id: "tenant-a" });
                return { id: "tenant-a" };
              },
            },
            tenantSettings: {
              upsert: async (args: unknown) => {
                assert.deepEqual(args.where, { tenantId: "tenant-a" });
                return { tenantId: "tenant-a" };
              },
            },
          } as never);
          assert.deepEqual(await service.business("tenant-a"), {
            id: "tenant-a",
          });
          assert.deepEqual(await service.settings("tenant-a"), {
            tenantId: "tenant-a",
          });
        });
        return { id: "user-a", tenantId: "tenant-a" };
      },
    },
  } as never);
  assert.deepEqual(await service.profile("user-a", "tenant-a"), {
    id: "user-a",
    tenantId: "tenant-a",
  });
});
