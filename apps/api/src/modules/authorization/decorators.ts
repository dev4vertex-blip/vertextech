import { SetMetadata } from "@nestjs/common";

export const REQUIRED_ROLES = "required_roles";
export const REQUIRED_PERMISSIONS = "required_permissions";
export const Roles = (...roles: string[]) => SetMetadata(REQUIRED_ROLES, roles);
export const Permissions = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS, permissions);
