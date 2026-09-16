import { PrismaClient, RoleScope } from "@prisma/client";

const prisma = new PrismaClient();

const internalRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "IT",
  "SALES",
  "OPERATIONS",
  "HR",
  "FINANCE",
  "SUPPORT",
  "DEVELOPMENT",
];
const tenantRoles = ["OWNER", "ADMIN", "MANAGER", "STAFF"];
const permissionKeys = [
  "users.read",
  "users.create",
  "users.update",
  "users.delete",
];

async function main(): Promise<void> {
  const permissions = new Map<string, string>();
  for (const key of permissionKeys) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: `Permission to ${key.replace(".", " ")}` },
    });
    permissions.set(key, permission.id);
  }

  for (const name of [...internalRoles, ...tenantRoles]) {
    const scope = internalRoles.includes(name)
      ? RoleScope.INTERNAL
      : RoleScope.TENANT;
    const role = await prisma.role.upsert({
      where: { scope_name: { scope, name } },
      update: {},
      create: { name, scope },
    });

    if (name === "SUPER_ADMIN" || name === "OWNER" || name === "ADMIN") {
      for (const permissionId of permissions.values()) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: role.id, permissionId },
          },
          update: {},
          create: { roleId: role.id, permissionId },
        });
      }
    }
  }
}

main()
  .finally(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
