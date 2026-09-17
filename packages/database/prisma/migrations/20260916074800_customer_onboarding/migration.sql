-- CreateEnum
CREATE TYPE "VerificationPurpose" AS ENUM ('EMAIL', 'PHONE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" "VerificationPurpose" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_tokenHash_key"
ON "verification_tokens"("tokenHash");
CREATE INDEX "verification_tokens_userId_purpose_consumedAt_idx"
ON "verification_tokens"("userId", "purpose", "consumedAt");
CREATE INDEX "verification_tokens_expiresAt_idx"
ON "verification_tokens"("expiresAt");
CREATE UNIQUE INDEX "users_tenantId_phone_key" ON "users"("tenantId", "phone");

-- AddForeignKey
ALTER TABLE "verification_tokens"
ADD CONSTRAINT "verification_tokens_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
