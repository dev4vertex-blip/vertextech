import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "@vertex/database";

import { AuthenticatedRequest } from "./authorization.types.js";

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException("Authenticated identity is missing");
    }
    if (user.domain === "CUSTOMER" && !user.tenantId) {
      throw new ForbiddenException("Customer tenant context is missing");
    }
    if (user.domain === "CUSTOMER") {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: user.tenantId! },
        select: { status: true },
      });
      if (!tenant || tenant.status !== "ACTIVE") {
        throw new ForbiddenException("Customer tenant is inactive");
      }
    }
    request.tenantId = user.tenantId ?? undefined;
    return true;
  }
}
