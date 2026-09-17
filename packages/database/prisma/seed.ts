import { PrismaClient, RoleScope } from "@prisma/client";

const prisma = new PrismaClient();

const internalRoles = [
  { name: "SUPER_ADMIN", description: "Highest platform-level authority" },
  { name: "ADMIN", description: "Vertex internal administration" },
  { name: "IT", description: "Vertex information technology" },
  { name: "SALES", description: "Vertex sales operations" },
  { name: "HR", description: "Vertex human resources" },
  { name: "SUPPORT", description: "Vertex customer and platform support" },
  { name: "FINANCE", description: "Vertex finance operations" },
  { name: "OPERATIONS", description: "Vertex business operations" },
  { name: "DEVELOPMENT", description: "Vertex product development" },
];
const tenantRoles = [
  { name: "OWNER", description: "Highest authority within a customer tenant" },
  { name: "ADMIN", description: "Customer tenant administration" },
  { name: "MANAGER", description: "Customer tenant team management" },
  { name: "STAFF", description: "Customer tenant operational user" },
  { name: "CRM_VIEWER", description: "Read-only CRM access for a tenant user" },
];
const permissionKeys = [
  "users.read",
  "users.create",
  "users.update",
  "users.delete",
  "crm.leads.read",
  "dashboard.read",
  "business.read",
  "business.update",
  "settings.read",
  "settings.update",
  "team.summary.read",
];
const roleDefinitions = [
  ...internalRoles.map((role) => ({ ...role, scope: RoleScope.INTERNAL })),
  ...tenantRoles.map((role) => ({ ...role, scope: RoleScope.TENANT })),
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

  const roles = new Map<string, string>();
  for (const definition of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: {
        scope_name: { scope: definition.scope, name: definition.name },
      },
      update: { description: definition.description },
      create: {
        name: definition.name,
        description: definition.description,
        scope: definition.scope,
      },
    });
    roles.set(`${definition.scope}:${definition.name}`, role.id);
  }

  const hierarchy = [
    ...internalRoles
      .filter(({ name }) => name !== "SUPER_ADMIN")
      .map(({ name }) => ({
        scope: RoleScope.INTERNAL,
        name,
        parentName: "SUPER_ADMIN",
      })),
    ...tenantRoles
      .filter(({ name }) => name !== "OWNER")
      .map(({ name }) => ({
        scope: RoleScope.TENANT,
        name,
        parentName: "OWNER",
      })),
  ];
  for (const relation of hierarchy) {
    await prisma.role.update({
      where: {
        scope_name: { scope: relation.scope, name: relation.name },
      },
      data: {
        parentRoleId: roles.get(`${relation.scope}:${relation.parentName}`),
      },
    });
  }

  for (const definition of roleDefinitions) {
    const roleId = roles.get(`${definition.scope}:${definition.name}`);
    if (!roleId) {
      throw new Error(
        `Seeded role is missing: ${definition.scope}:${definition.name}`,
      );
    }
    const rolePermissionNames =
      definition.scope === RoleScope.INTERNAL ||
      definition.name === "OWNER" ||
      definition.name === "ADMIN"
        ? permissionKeys
        : definition.name === "MANAGER"
          ? [
              "dashboard.read",
              "business.read",
              "settings.read",
              "team.summary.read",
            ]
          : definition.name === "STAFF"
            ? ["dashboard.read"]
            : [];
    for (const permissionKey of rolePermissionNames) {
      const permissionId = permissions.get(permissionKey);
      if (!permissionId) {
        throw new Error(`Permission is missing: ${permissionKey}`);
      }
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: "tenant-a" },
    update: { name: "Tenant A" },
    create: { name: "Tenant A", slug: "tenant-a" },
  });
  const user = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: "user.a@tenant-a.example" },
  });
  const tenantUser =
    user ??
    (await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: "user.a@tenant-a.example",
        firstName: "User",
        lastName: "A",
      },
    }));
  const crmViewerRoleId = roles.get(`${RoleScope.TENANT}:CRM_VIEWER`);
  const crmPermissionId = permissions.get("crm.leads.read");
  if (!crmViewerRoleId || !crmPermissionId) {
    throw new Error("CRM example role or permission was not seeded");
  }
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: crmViewerRoleId,
        permissionId: crmPermissionId,
      },
    },
    update: {},
    create: { roleId: crmViewerRoleId, permissionId: crmPermissionId },
  });
  await prisma.userRole.upsert({
    where: {
      userId_roleId_tenantId: {
        userId: tenantUser.id,
        roleId: crmViewerRoleId,
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      userId: tenantUser.id,
      roleId: crmViewerRoleId,
      tenantId: tenant.id,
    },
  });
}

main()
  .finally(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
