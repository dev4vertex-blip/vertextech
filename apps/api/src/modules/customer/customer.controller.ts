import { Controller, Get, Req, UseGuards } from "@nestjs/common";

import { AuthGuard } from "../authorization/auth.guard.js";
import { AuthenticatedRequest } from "../authorization/authorization.types.js";
import { TenantContextGuard } from "../authorization/tenant-context.guard.js";
import { CustomerService } from "./customer.service.js";

@Controller("customer")
export class CustomerController {
  constructor(private readonly customer: CustomerService) {}

  @Get("profile")
  @UseGuards(AuthGuard, TenantContextGuard)
  profile(@Req() request: AuthenticatedRequest) {
    return this.customer.profile(request.user!.id, request.tenantId!);
  }
}
