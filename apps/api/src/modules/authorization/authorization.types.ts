export interface AuthenticatedUser {
  id: string;
  tenantId: string | null;
  domain: "INTERNAL" | "CUSTOMER";
  roles: string[];
  permissions: string[];
}

export interface AuthenticatedRequest {
  user?: AuthenticatedUser;
  tenantId?: string;
}
