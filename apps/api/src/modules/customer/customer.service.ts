import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Prisma, PrismaService } from "@vertex/database";
import { UpdateBusinessDto, UpdateSettingsDto } from "./dto.js";

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async profile(userId: string, tenantId: string) {
    const profile = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, domain: "CUSTOMER" },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        status: true,
        tenant: { select: { id: true, name: true, slug: true, status: true } },
        roles: {
          where: { tenantId },
          select: { role: { select: { name: true, scope: true } } },
        },
      },
    });
    if (!profile) {
      throw new ForbiddenException("Customer tenant context is invalid");
    }
    return profile;
  }

  dashboard(userId: string, tenantId: string) {
    return this.prisma.tenant.findFirstOrThrow({
      where: {
        id: tenantId,
        status: "ACTIVE",
        users: { some: { id: userId } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        users: {
          where: { id: userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            roles: {
              where: { tenantId },
              select: { role: { select: { name: true } } },
            },
          },
        },
        _count: { select: { users: true } },
      },
    });
  }

  business(tenantId: string) {
    return this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        businessEmail: true,
        businessPhone: true,
        website: true,
        industry: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        timezone: true,
        currency: true,
        logoReference: true,
        status: true,
      },
    });
  }

  async updateBusiness(tenantId: string, dto: UpdateBusinessDto) {
    try {
      return await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          ...dto,
          ...(dto.slug ? { slug: normalizeSlug(dto.slug) } : {}),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Business slug or contact conflicts");
      }
      throw error;
    }
  }

  settings(tenantId: string) {
    return this.prisma.tenantSettings.upsert({
      where: { tenantId },
      update: {},
      create: { tenantId },
    });
  }

  updateSettings(tenantId: string, dto: UpdateSettingsDto) {
    return this.prisma.tenantSettings.upsert({
      where: { tenantId },
      update: dto as Prisma.TenantSettingsUpdateInput,
      create: { tenantId, ...dto },
    });
  }

  teamSummary(tenantId: string) {
    return this.prisma.user
      .groupBy({
        by: ["status"],
        where: { tenantId, domain: "CUSTOMER" },
        _count: { _all: true },
      })
      .then((rows) => ({
        totalUsers: rows.reduce((sum, row) => sum + row._count._all, 0),
        activeUsers:
          rows.find((row) => row.status === "ACTIVE")?._count._all ?? 0,
        inactiveUsers: rows
          .filter((row) => row.status !== "ACTIVE")
          .reduce((sum, row) => sum + row._count._all, 0),
      }));
  }
}

function normalizeSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug || slug.length > 100)
    throw new ForbiddenException("Business slug is invalid");
  return slug;
}
