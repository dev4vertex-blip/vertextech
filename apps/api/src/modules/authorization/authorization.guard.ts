import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { REQUIRED_PERMISSIONS, REQUIRED_ROLES } from "./decorators.js";
import { AuthenticatedRequest } from "./authorization.types.js";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user)
      throw new ForbiddenException("Authenticated identity is missing");
    const roles =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_ROLES, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    const permissions =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (roles.length && !roles.some((role) => user.roles.includes(role))) {
      throw new ForbiddenException("Insufficient role");
    }
    if (
      permissions.length &&
      !permissions.some((permission) => user.permissions.includes(permission))
    ) {
      throw new ForbiddenException("Insufficient permission");
    }
    return true;
  }
}
