import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { Prisma, PrismaService } from "@vertex/database";
import { createHash, randomBytes } from "node:crypto";

import { AppConfig } from "../../config/app-config.js";
import {
  InviteTeamMemberDto,
  TeamListQueryDto,
  UpdateTeamMemberDto,
} from "./dto.js";
import {
  INVITATION_PROVIDER,
  InvitationProvider,
} from "./invitation.provider.js";

const INVITABLE_ROLES = ["ADMIN", "MANAGER", "STAFF"] as const;

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
    @Inject(INVITATION_PROVIDER)
    private readonly invitations: InvitationProvider,
  ) {}

  async list(tenantId: string, query: TeamListQueryDto) {
    const page = Number(query.page ?? 1);
    const pageSize = Math.min(Number(query.pageSize ?? 20), 100);
    const where: Prisma.UserWhereInput = {
      tenantId,
      domain: "CUSTOMER",
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: "insensitive" } },
              { lastName: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.role
        ? { roles: { some: { tenantId, role: { name: query.role } } } }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          roles: {
            where: { tenantId },
            select: { role: { select: { name: true } } },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  member(tenantId: string, userId: string) {
    return this.prisma.user.findFirstOrThrow({
      where: { id: userId, tenantId, domain: "CUSTOMER" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        roles: {
          where: { tenantId },
          select: { role: { select: { name: true } } },
        },
      },
    });
  }

  async invite(
    tenantId: string,
    createdById: string,
    dto: InviteTeamMemberDto,
  ) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { email },
      select: { id: true, tenantId: true },
    });
    if (existing)
      throw new ConflictException("This email already belongs to a user");
    const pending = await this.prisma.invitation.findFirst({
      where: {
        tenantId,
        invitedEmail: email,
        acceptedAt: null,
        revokedAt: null,
      },
    });
    if (pending)
      throw new ConflictException("An active invitation already exists");
    const role = await this.prisma.role.findUnique({
      where: { scope_name: { scope: "TENANT", name: dto.role } },
    });
    if (!role || !INVITABLE_ROLES.includes(dto.role)) {
      throw new ForbiddenException("Role cannot be assigned by invitation");
    }
    const token = randomBytes(32).toString("base64url");
    const invitation = await this.prisma.invitation.create({
      data: {
        tenantId,
        createdById,
        invitedEmail: email,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        roleId: role.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(
          Date.now() + parseDuration(this.config.verificationTokenExpiresIn),
        ),
      },
      select: { id: true, invitedEmail: true, expiresAt: true },
    });
    await this.invitations.send({ email, token });
    return {
      ...invitation,
      ...(this.config.nodeEnv === "development"
        ? { developmentInvitationToken: token }
        : {}),
    };
  }

  async update(tenantId: string, userId: string, dto: UpdateTeamMemberDto) {
    const target = await this.member(tenantId, userId);
    if (target.roles.some(({ role }) => role.name === "OWNER")) {
      throw new ForbiddenException("Tenant owner is protected");
    }
    if (dto.role && !INVITABLE_ROLES.includes(dto.role)) {
      throw new ForbiddenException("Role cannot be assigned by customer admins");
    }
    const role = dto.role
      ? await this.prisma.role.findUniqueOrThrow({
          where: { scope_name: { scope: "TENANT", name: dto.role } },
        })
      : undefined;
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          firstName: dto.firstName?.trim(),
          lastName: dto.lastName?.trim(),
        },
      });
      if (role) {
        await tx.userRole.deleteMany({ where: { userId, tenantId } });
        await tx.userRole.create({
          data: { userId, roleId: role.id, tenantId },
        });
      }
      return user;
    });
  }

  async updateStatus(
    tenantId: string,
    userId: string,
    status: "ACTIVE" | "SUSPENDED",
  ) {
    const target = await this.member(tenantId, userId);
    if (target.roles.some(({ role }) => role.name === "OWNER")) {
      throw new ForbiddenException("Tenant owner is protected");
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, status: true },
    });
  }

  async remove(tenantId: string, userId: string) {
    return this.updateStatus(tenantId, userId, "SUSPENDED");
  }
}

function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function parseDuration(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return 24 * 60 * 60 * 1000;
  const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
  return Number(match[1]) * units[match[2] as keyof typeof units];
}
