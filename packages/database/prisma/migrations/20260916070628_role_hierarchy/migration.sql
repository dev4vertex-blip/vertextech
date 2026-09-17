-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "parentRoleId" UUID;

-- CreateIndex
CREATE INDEX "roles_parentRoleId_idx" ON "roles"("parentRoleId");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_parentRoleId_fkey" FOREIGN KEY ("parentRoleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
