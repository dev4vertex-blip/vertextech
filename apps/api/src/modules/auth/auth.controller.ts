import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";

import { AuthGuard } from "../authorization/auth.guard.js";
import { AuthenticatedRequest } from "../authorization/authorization.types.js";
import { TenantContextGuard } from "../authorization/tenant-context.guard.js";
import { AuthService } from "./auth.service.js";
import {
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  VerifyEmailDto,
} from "./dto.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post("verify-email")
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post("logout")
  @UseGuards(AuthGuard, TenantContextGuard)
  async logout(@Body() dto: RefreshTokenDto): Promise<{ success: true }> {
    await this.auth.logout(dto.refreshToken);
    return { success: true };
  }

  @Get("me")
  @UseGuards(AuthGuard, TenantContextGuard)
  currentUser(@Req() request: AuthenticatedRequest) {
    return this.auth.currentUser(request.user!.id);
  }
}
