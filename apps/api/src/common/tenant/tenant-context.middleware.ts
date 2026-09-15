import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

export interface TenantRequest extends Request {
  tenantId?: string;
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(request: TenantRequest, _response: Response, next: NextFunction): void {
    const tenantId = request.header("x-tenant-id")?.trim();
    if (tenantId) {
      request.tenantId = tenantId;
    }

    next();
  }
}
