import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "@vertex/database";
import { createHash, randomBytes } from "node:crypto";

import { AppConfig } from "../../config/app-config.js";
import { AuthenticatedUser } from "../authorization/authorization.types.js";
import { LoginDto, RegisterDto } from "./dto.js";
import { PasswordHasherService } from "./password-hasher.service.js";
import { TokenService } from "./token.service.js";
import {
  VERIFICATION_PROVIDER,
  VerificationProvider,
} from "./verification.provider.js";
import { Inject } from "@nestjs/common";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hasher: PasswordHasherService,
    private readonly tokens: TokenService,
    private readonly config: AppConfig,
    @Inject(VERIFICATION_PROVIDER)
    private readonly verificationProvider: VerificationProvider,
  ) {}

  async register(dto: RegisterDto) {
    const slug = normalizeSlug(dto.tenantSlug);
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await this.hasher.hash(dto.password);
    const verification = createVerificationToken();
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: { name: dto.tenantName.trim(), slug },
        });
        const ownerRole = await tx.role.findUniqueOrThrow({
          where: { scope_name: { scope: "TENANT", name: "OWNER" } },
        });
        const user = await tx.user.create({
          data: {
            tenantId: tenant.id,
            email,
            phone: dto.phone,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            passwordHash,
            status: "INVITED",
          },
        });
        await tx.userRole.create({
          data: { userId: user.id, roleId: ownerRole.id, tenantId: tenant.id },
        });
        await tx.verificationToken.create({
          data: {
            userId: user.id,
            tokenHash: hashVerificationToken(verification.value),
            purpose: "EMAIL",
            expiresAt: new Date(
              Date.now() +
                parseDuration(this.config.verificationTokenExpiresIn),
            ),
          },
        });
        return { tenant, user };
      });
      await this.verificationProvider.sendEmailVerification({
        email,
        token: verification.value,
      });
      return {
        userId: result.user.id,
        tenantId: result.tenant.id,
        status: "PENDING_EMAIL_VERIFICATION",
        ...(this.config.nodeEnv === "development"
          ? { developmentVerificationToken: verification.value }
          : {}),
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        throw new ConflictException("Email or business slug already exists");
      }
      throw error;
    }
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.verificationToken.findFirst({
      where: {
        tokenHash: hashVerificationToken(token),
        purpose: "EMAIL",
        consumedAt: null,
      },
    });
    if (!record || record.expiresAt <= new Date()) {
      throw new UnauthorizedException("Invalid or expired verification token");
    }

    await this.prisma.$transaction([
      this.prisma.verificationToken.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date(), status: "ACTIVE" },
      }),
    ]);
    return { verified: true };
  }

  async acceptInvitation(token: string, password: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        tokenHash: hashVerificationToken(token),
        acceptedAt: null,
        revokedAt: null,
      },
      include: { role: true },
    });
    if (
      !invitation ||
      invitation.expiresAt <= new Date() ||
      invitation.role.scope !== "TENANT"
    ) {
      throw new UnauthorizedException("Invalid or expired invitation");
    }
    const existing = await this.prisma.user.findFirst({
      where: { email: invitation.invitedEmail },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException("This invitation cannot be accepted");
    }
    const passwordHash = await this.hasher.hash(password);
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId: invitation.tenantId,
          email: invitation.invitedEmail,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          passwordHash,
          emailVerifiedAt: new Date(),
          status: "ACTIVE",
        },
      });
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: invitation.roleId,
          tenantId: invitation.tenantId,
        },
      });
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
      return user;
    });
    return {
      userId: result.id,
      tenantId: result.tenantId,
      role: invitation.role.name,
    };
  }

  async login(dto: LoginDto) {
    const users = await this.prisma.user.findMany({
      where: {
        email: dto.email.trim().toLowerCase(),
        ...(dto.tenantSlug
          ? { tenant: { is: { slug: dto.tenantSlug.trim().toLowerCase() } } }
          : {}),
      },
    });
    const user = users.length === 1 ? users[0] : null;
    if (
      !user?.passwordHash ||
      user.status !== "ACTIVE" ||
      (user.domain === "CUSTOMER" && !dto.tenantSlug) ||
      (user.domain === "CUSTOMER" && !user.emailVerifiedAt) ||
      !(await this.hasher.verify(user.passwordHash, dto.password))
    ) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.issueTokens(user.id);
  }

  async refresh(refreshToken: string) {
    const record = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: this.tokens.hash(refreshToken), revokedAt: null },
    });
    if (!record || record.expiresAt <= new Date()) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(record.userId);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.tokens.hash(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  currentUser(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        tenantId: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        status: true,
        domain: true,
        createdAt: true,
        updatedAt: true,
        tenant: { select: { id: true, name: true, slug: true, status: true } },
        roles: {
          select: {
            tenantId: true,
            role: { select: { name: true, scope: true } },
          },
        },
      },
    });
  }

  private async issueTokens(userId: string) {
    const identity = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { tenantId: true },
    });
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        roles: {
          where: { tenantId: identity.tenantId },
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
    const authUser: AuthenticatedUser = {
      id: user.id,
      tenantId: user.tenantId,
      domain: user.domain,
      roles: user.roles.map(({ role }) => role.name),
      permissions: [
        ...new Set(
          user.roles.flatMap(({ role }) =>
            role.permissions.map(({ permission }) => permission.key),
          ),
        ),
      ],
    };
    const refresh = this.tokens.createRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refresh.hash,
        expiresAt: new Date(
          Date.now() + parseDuration(this.config.jwtRefreshExpiresIn),
        ),
      },
    });
    return {
      accessToken: this.tokens.accessToken(authUser),
      refreshToken: refresh.value,
      user: authUser,
    };
  }
}

function normalizeSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug || slug.length > 100) {
    throw new ConflictException("Business slug is invalid");
  }
  return slug;
}

function createVerificationToken(): { value: string } {
  return { value: randomBytes(32).toString("base64url") };
}

function hashVerificationToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function parseDuration(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return 24 * 60 * 60 * 1000;
  const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
  return Number(match[1]) * units[match[2] as keyof typeof units];
}
