import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "@vertex/database";

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
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      const current = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          roles: {
            where: { tenantId: currentTenantId(payload.tenantId) },
            include: {
              role: {
                include: { permissions: { include: { permission: true } } },
              },
            },
          },
        },
      });
      if (
        !current ||
        current.status !== "ACTIVE" ||
        current.domain !== payload.domain ||
        current.tenantId !== (payload.tenantId ?? null)
      ) {
        throw new Error("Identity is no longer active");
      }
      const roles = current.roles.map(({ role }) => role.name).sort();
      const permissions = [
        ...new Set(
          current.roles.flatMap(({ role }) =>
            role.permissions.map(({ permission }) => permission.key),
          ),
        ),
      ].sort();
      if (
        JSON.stringify(roles) !== JSON.stringify([...payload.roles].sort()) ||
        JSON.stringify(permissions) !==
          JSON.stringify([...payload.permissions].sort())
      ) {
        throw new Error("Authorization claims are stale");
      }
      request.user = {
        id: current.id,
        tenantId: current.tenantId,
        domain: current.domain,
        roles,
        permissions,
      };
      request.tenantId = current.tenantId ?? undefined;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }
}

function currentTenantId(tenantId: string | null | undefined): string | null {
  return tenantId ?? null;
}
