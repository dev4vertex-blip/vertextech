# VertexTech

Monorepo for VertexTech applications, shared packages, infrastructure, documentation, tests, and development scripts.

## Repository layout

- `apps/` - deployable applications
- `packages/` - shared libraries and domain modules
- `infrastructure/` - infrastructure-as-code
- `docs/` - project documentation
- `tests/` - cross-project tests
- `scripts/` - development and maintenance scripts

## Platform role hierarchy

The authorization foundation keeps Vertex's internal organization separate from
customer tenants:

- Internal: `SUPER_ADMIN` is the platform authority, with `ADMIN`, `IT`, `SALES`,
  `HR`, `SUPPORT`, `FINANCE`, `OPERATIONS`, and `DEVELOPMENT` beneath it.
- Customer tenant: `OWNER` is the tenant authority, with `ADMIN`, `MANAGER`, and
  `STAFF` beneath it.

Role scope and parent-role relationships are stored in the database. A role's
hierarchy does not grant customer-tenant access to internal users; tenant
context still comes from the authenticated identity.

## Authenticated request pipeline

Protected requests follow this order:

`AuthService` verifies the password and issues access/refresh tokens. The
`AuthGuard` verifies the access token, `TenantContextGuard` derives tenant
context from the authenticated identity, and `RoleGuard` and `PermissionGuard`
enforce endpoint metadata before the controller delegates to its service and
database layer. Client-supplied tenant headers are not used as the source of
authorization context.

Development seed example:

`Tenant A → User A → CRM_VIEWER → crm.leads.read`

This seeds only the tenant, user, role, and permission assignment needed to
demonstrate tenant-scoped authorization. It does not create CRM tables or
implement CRM functionality.

## Customer onboarding endpoints

- Flow: `Customer → Register → Business Information → Tenant Create →
OWNER User Create → Email/Phone Verification → Login → Access Token →
Tenant Context → Customer Dashboard`.
- Simplified business flow: `Register → ABC Company → Tenant automatically
created → User automatically created → OWNER assigned → Login → Customer
Dashboard`.
- `POST /api/auth/register` creates a tenant and its first `OWNER` atomically.
- `POST /api/auth/verify-email` consumes the hashed verification token.
- `POST /api/auth/login` requires an active, email-verified customer and a
  tenant slug.
- `GET /api/auth/me` returns safe identity, tenant, and role information.
- `POST /api/auth/logout` revokes the supplied refresh token server-side.
- `GET /api/customer/profile` returns only the authenticated customer's profile
  and tenant-scoped roles.

The customer dashboard foundation is represented by the authenticated
`/api/customer/profile` endpoint. It is intentionally limited to identity and
tenant context; business modules are not part of this phase.

In development, registration returns a `developmentVerificationToken` so the
flow can be tested without a third-party provider. Production delivery is
represented by the `VerificationProvider` abstraction and must be replaced by
an email/SMS provider before production deployment.
