import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { AppConfig } from "../../config/app-config.js";
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from "./authorization.types.js";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<
        AuthenticatedRequest & { headers: Record<string, string | undefined> }
      >();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) throw new UnauthorizedException("Authentication required");
    try {
      const payload = this.jwt.verify<AuthenticatedUser & { sub?: string }>(
        token,
        {
          secret: this.config.jwtAccessSecret,
        },
      );
      if (!payload.sub || !payload.domain) throw new Error("Invalid token");
      request.user = { ...payload, id: payload.sub };
      request.tenantId = payload.tenantId ?? undefined;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }
}
