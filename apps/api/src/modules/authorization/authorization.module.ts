import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { DatabaseModule } from "@vertex/database";

import { AppConfig } from "../../config/app-config.js";
import { AuthGuard } from "./auth.guard.js";
import { AuthorizationGuard } from "./authorization.guard.js";
import { PermissionGuard } from "./permission.guard.js";
import { RoleGuard } from "./role.guard.js";
import { TenantContextGuard } from "./tenant-context.guard.js";

@Module({
  imports: [JwtModule.register({}), DatabaseModule],
  providers: [
    AuthGuard,
    AuthorizationGuard,
    PermissionGuard,
    RoleGuard,
    TenantContextGuard,
    AppConfig,
  ],
  exports: [
    AuthGuard,
    AuthorizationGuard,
    PermissionGuard,
    RoleGuard,
    TenantContextGuard,
  ],
})
export class AuthorizationModule {}
