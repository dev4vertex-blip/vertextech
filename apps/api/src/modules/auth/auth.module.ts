import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AppConfig } from "../../config/app-config.js";
import { AuthorizationModule } from "../authorization/authorization.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { PasswordHasherService } from "./password-hasher.service.js";
import { TokenService } from "./token.service.js";
import {
  DevelopmentVerificationProvider,
  VERIFICATION_PROVIDER,
} from "./verification.provider.js";

@Module({
  imports: [JwtModule.register({}), AuthorizationModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordHasherService,
    TokenService,
    AppConfig,
    {
      provide: VERIFICATION_PROVIDER,
      useClass: DevelopmentVerificationProvider,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
