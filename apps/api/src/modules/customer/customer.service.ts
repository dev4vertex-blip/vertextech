import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "@vertex/database";

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
}
