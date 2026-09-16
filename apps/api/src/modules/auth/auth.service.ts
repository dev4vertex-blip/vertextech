import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "@vertex/database";

import { AppConfig } from "../../config/app-config.js";
import { AuthenticatedUser } from "../authorization/authorization.types.js";
import { LoginDto, RefreshTokenDto, RegisterDto } from "./dto.js";
import { PasswordHasherService } from "./password-hasher.service.js";
import { TokenService } from "./token.service.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hasher: PasswordHasherService,
    private readonly tokens: TokenService,
    private readonly config: AppConfig,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await this.hasher.hash(dto.password);
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: { name: dto.tenantName, slug: dto.tenantSlug },
        });
        const ownerRole = await tx.role.findUniqueOrThrow({
          where: { scope_name: { scope: "TENANT", name: "OWNER" } },
        });
        const created = await tx.user.create({
          data: {
            tenantId: tenant.id,
            email: dto.email.toLowerCase(),
            firstName: dto.firstName,
            lastName: dto.lastName,
            passwordHash,
          },
        });
        await tx.userRole.create({
          data: {
            userId: created.id,
            roleId: ownerRole.id,
            tenantId: tenant.id,
          },
        });
        return created;
      });
      return this.issueTokens(user.id);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Unique constraint")
      ) {
        throw new ConflictException("Tenant or user already exists");
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), tenantId: dto.tenantId },
    });
    if (
      !user?.passwordHash ||
      !(await this.hasher.verify(user.passwordHash, dto.password))
    ) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.issueTokens(user.id);
  }

  async refresh(dto: RefreshTokenDto) {
    const record = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: this.tokens.hash(dto.refreshToken), revokedAt: null },
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
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
  }

  private async issueTokens(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        roles: {
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
        expiresAt: new Date(Date.now() + this.refreshLifetimeMs()),
      },
    });
    return {
      accessToken: this.tokens.accessToken(authUser),
      refreshToken: refresh.value,
      user: authUser,
    };
  }

  private refreshLifetimeMs(): number {
    const match = /^(\d+)([smhd])$/.exec(this.config.jwtRefreshExpiresIn);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
    return Number(match[1]) * units[match[2] as keyof typeof units];
  }
}
