import { Injectable } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { createHash, randomBytes } from "node:crypto";

import { AppConfig } from "../../config/app-config.js";
import { AuthenticatedUser } from "../authorization/authorization.types.js";

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
  ) {}

  accessToken(user: AuthenticatedUser): string {
    return this.jwt.sign(
      {
        sub: user.id,
        tenantId: user.tenantId,
        domain: user.domain,
        roles: user.roles,
        permissions: user.permissions,
      },
      {
        secret: this.config.jwtAccessSecret,
        expiresIn: this.config
          .jwtAccessExpiresIn as JwtSignOptions["expiresIn"],
      },
    );
  }

  createRefreshToken(): { value: string; hash: string } {
    const value = randomBytes(48).toString("base64url");
    return { value, hash: this.hash(value) };
  }

  hash(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }
}
