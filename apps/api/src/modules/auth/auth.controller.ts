import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";

import { AuthGuard } from "../authorization/auth.guard.js";
import { AuthenticatedRequest } from "../authorization/authorization.types.js";
import { AuthService } from "./auth.service.js";
import { LoginDto, RefreshTokenDto, RegisterDto } from "./dto.js";

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

  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto);
  }

  @Post("logout")
  @UseGuards(AuthGuard)
  async logout(@Body() dto: RefreshTokenDto): Promise<{ success: true }> {
    await this.auth.logout(dto.refreshToken);
    return { success: true };
  }

  @Get("me")
  @UseGuards(AuthGuard)
  currentUser(@Req() request: AuthenticatedRequest) {
    return this.auth.currentUser(request.user!.id);
  }
}
