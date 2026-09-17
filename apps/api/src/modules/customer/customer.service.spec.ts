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
        return { id: "user-a", tenantId: "tenant-a" };
      },
    },
  } as never);
  assert.deepEqual(await service.profile("user-a", "tenant-a"), {
    id: "user-a",
    tenantId: "tenant-a",
  });
});
