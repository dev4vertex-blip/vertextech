import assert from "node:assert/strict";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { test } from "node:test";

import { AuthGuard } from "./auth.guard.js";
import { AuthorizationGuard } from "./authorization.guard.js";
import { REQUIRED_PERMISSIONS, REQUIRED_ROLES } from "./decorators.js";
import { PermissionGuard } from "./permission.guard.js";
import { RoleGuard } from "./role.guard.js";
import { TenantContextGuard } from "./tenant-context.guard.js";

function context(
  request: object,
  handler = (): void => undefined,
): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => handler,
    getClass: () => class TestController {},
  } as ExecutionContext;
}

test("authentication guard rejects missing credentials", async () => {
  const guard = new AuthGuard(
    { verify: () => ({}) } as never,
    { jwtAccessSecret: "secret" } as never,
    {} as never,
  );

  await assert.rejects(
    () => guard.canActivate(context({ headers: {} })),
    /Authentication required/,
  );
});

test("authorization guard enforces roles and permissions", () => {
  const reflector = new Reflector();
  const handler = (): void => undefined;
  Reflect.defineMetadata(REQUIRED_ROLES, ["OWNER"], handler);
  Reflect.defineMetadata(REQUIRED_PERMISSIONS, ["users.read"], handler);
  const guard = new AuthorizationGuard(reflector);

  assert.equal(
    guard.canActivate(
      context(
        {
          user: {
            id: "user",
            tenantId: "tenant",
            domain: "CUSTOMER",
            roles: ["OWNER"],
            permissions: ["users.read"],
          },
        },
        handler,
      ),
    ),
    true,
  );
  assert.throws(
    () =>
      guard.canActivate(
        context(
          {
            user: {
              id: "user",
              tenantId: "tenant",
              domain: "CUSTOMER",
              roles: ["STAFF"],
              permissions: [],
            },
          },
          handler,
        ),
      ),
    ForbiddenException,
  );
});

test("tenant context guard derives context from the authenticated identity", () => {
  const request = {
    tenantId: "untrusted-header",
    user: {
      id: "user",
      tenantId: "tenant-a",
      domain: "CUSTOMER" as const,
      roles: [],
      permissions: [],
    },
  };
  assert.equal(new TenantContextGuard().canActivate(context(request)), true);
  assert.equal(request.tenantId, "tenant-a");
});

test("role and permission guards enforce their own metadata", () => {
  const reflector = new Reflector();
  const handler = (): void => undefined;
  Reflect.defineMetadata(REQUIRED_ROLES, ["OWNER"], handler);
  Reflect.defineMetadata(REQUIRED_PERMISSIONS, ["users.read"], handler);
  const request = {
    user: {
      id: "user",
      tenantId: "tenant",
      domain: "CUSTOMER" as const,
      roles: ["OWNER"],
      permissions: ["users.read"],
    },
  };
  assert.equal(
    new RoleGuard(reflector).canActivate(context(request, handler)),
    true,
  );
  assert.equal(
    new PermissionGuard(reflector).canActivate(context(request, handler)),
    true,
  );
});
