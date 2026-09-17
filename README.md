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

## Customer dashboard and tenant settings

- `GET /api/customer/dashboard` returns the authenticated tenant workspace
  summary and real team count.
- `GET /api/customer/business` reads the current tenant business profile.
- `PATCH /api/customer/business` updates business profile fields and validates
  slug uniqueness.
- `GET /api/customer/settings` reads the current tenant's settings.
- `PATCH /api/customer/settings` updates tenant-specific settings.
- `GET /api/customer/team/summary` returns total, active, and inactive customer
  user counts.

Business and settings access is permission-based. OWNER and ADMIN can update
business/settings, MANAGER has read-only business/settings access, and STAFF
receives only permissions explicitly assigned to it. All queries use the
authenticated tenant context; no request tenant ID is accepted.

## Customer dashboard sections

After customer login, the dashboard foundation maps to these sections:

- **Business Overview** — `GET /api/customer/dashboard`; returns the current
  tenant identity, status, authenticated user, role, and real team count.
- **Business Profile** — `GET/PATCH /api/customer/business`; reads and updates
  the authenticated tenant's business information.
- **Users & Team** — `GET /api/customer/team/summary`; returns total, active,
  and inactive customer-user counts. Full user management is a later phase.
- **Tenant Settings** — `GET/PATCH /api/customer/settings`; manages the
  authenticated tenant's settings.
- **Security** — existing `GET /api/auth/me`, `POST /api/auth/logout`, and
  refresh-token revocation provide the current security foundation.
- **Activity Summary** — not implemented yet because the project does not have
  an audit/activity event store. No invented activity statistics are returned.

  ## Customer team management
  - `GET /api/customer/team` lists only the authenticated tenant's customer
    users with pagination, status/role filters, and search.
  - `GET /api/customer/team/:userId` reads one tenant-scoped team member.
  - `POST /api/customer/team/invite` creates a hashed, expiring invitation.
  - `POST /api/auth/invitations/accept` atomically creates the invited user,
    assigns the stored tenant role, and consumes the invitation.
  - `PATCH /api/customer/team/:userId` updates a team member and can change only
    `ADMIN`, `MANAGER`, or `STAFF`.
  - `PATCH /api/customer/team/:userId/status` suspends or reactivates a member.
  - `DELETE /api/customer/team/:userId` safely suspends a member rather than
    physically deleting historical user data.

  Team management requires the tenant-scoped `team.manage` permission. OWNER and
  ADMIN receive it through the seed; internal Vertex roles and the tenant OWNER
  cannot be assigned or modified through invitations/team operations. Invitation
  tokens are stored only as hashes and are single-use and expiring. Email
  delivery is provider-ready through `InvitationProvider`; development delivery
  is intentionally a no-op.

In development, registration returns a `developmentVerificationToken` so the
flow can be tested without a third-party provider. Production delivery is
represented by the `VerificationProvider` abstraction and must be replaced by
an email/SMS provider before production deployment.
