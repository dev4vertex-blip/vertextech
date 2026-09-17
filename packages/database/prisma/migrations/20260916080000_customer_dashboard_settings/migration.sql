-- AlterTable
ALTER TABLE "tenants"
ADD COLUMN "businessEmail" TEXT,
ADD COLUMN "businessPhone" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "industry" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "postalCode" TEXT,
ADD COLUMN "timezone" TEXT,
ADD COLUMN "currency" TEXT,
ADD COLUMN "logoReference" TEXT;

-- CreateTable
CREATE TABLE "tenant_settings" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "timezone" TEXT,
    "currency" TEXT,
    "dateFormat" TEXT,
    "language" TEXT,
    "notificationPreferences" JSONB NOT NULL DEFAULT '{}',
    "businessSettings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_settings_tenantId_key" ON "tenant_settings"("tenantId");

-- AddForeignKey
ALTER TABLE "tenant_settings"
ADD CONSTRAINT "tenant_settings_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
