import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AppConfig } from "../../config/app-config.js";
import { AuthGuard } from "./auth.guard.js";
import { AuthorizationGuard } from "./authorization.guard.js";

@Module({
  imports: [JwtModule.register({})],
  providers: [AuthGuard, AuthorizationGuard, AppConfig],
  exports: [AuthGuard, AuthorizationGuard],
})
export class AuthorizationModule {}
