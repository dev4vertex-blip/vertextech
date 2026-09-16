import assert from "node:assert/strict";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { test } from "node:test";

import { AuthGuard } from "./auth.guard.js";
import { AuthorizationGuard } from "./authorization.guard.js";
import { REQUIRED_PERMISSIONS, REQUIRED_ROLES } from "./decorators.js";

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

test("authentication guard rejects missing credentials", () => {
  const guard = new AuthGuard(
    { verify: () => ({}) } as never,
    { jwtAccessSecret: "secret" } as never,
  );

  assert.throws(
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
