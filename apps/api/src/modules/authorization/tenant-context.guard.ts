import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

import { AuthenticatedRequest } from "./authorization.types.js";

@Injectable()
export class TenantContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException("Authenticated identity is missing");
    }
    if (user.domain === "CUSTOMER" && !user.tenantId) {
      throw new ForbiddenException("Customer tenant context is missing");
    }
    request.tenantId = user.tenantId ?? undefined;
    return true;
  }
}
