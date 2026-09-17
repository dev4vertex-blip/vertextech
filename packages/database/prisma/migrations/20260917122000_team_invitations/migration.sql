-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "invitedEmail" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "roleId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invitations_tokenHash_key" ON "invitations"("tokenHash");
CREATE INDEX "invitations_tenantId_invitedEmail_idx"
ON "invitations"("tenantId", "invitedEmail");
CREATE INDEX "invitations_tenantId_acceptedAt_revokedAt_idx"
ON "invitations"("tenantId", "acceptedAt", "revokedAt");
CREATE INDEX "invitations_expiresAt_idx" ON "invitations"("expiresAt");

ALTER TABLE "invitations"
ADD CONSTRAINT "invitations_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invitations"
ADD CONSTRAINT "invitations_roleId_fkey"
FOREIGN KEY ("roleId") REFERENCES "roles"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invitations"
ADD CONSTRAINT "invitations_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
