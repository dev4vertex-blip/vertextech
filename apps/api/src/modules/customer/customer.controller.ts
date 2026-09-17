import { Body, Controller, Get, Patch, Req, UseGuards } from "@nestjs/common";

import { AuthGuard } from "../authorization/auth.guard.js";
import { AuthenticatedRequest } from "../authorization/authorization.types.js";
import { TenantContextGuard } from "../authorization/tenant-context.guard.js";
import { PermissionGuard } from "../authorization/permission.guard.js";
import { Permissions } from "../authorization/decorators.js";
import { CustomerService } from "./customer.service.js";
import { UpdateBusinessDto, UpdateSettingsDto } from "./dto.js";

@Controller("customer")
export class CustomerController {
  constructor(private readonly customer: CustomerService) {}

  @Get("profile")
  @UseGuards(AuthGuard, TenantContextGuard)
  profile(@Req() request: AuthenticatedRequest) {
    return this.customer.profile(request.user!.id, request.tenantId!);
  }

  @Get("dashboard")
  @UseGuards(AuthGuard, TenantContextGuard, PermissionGuard)
  @Permissions("dashboard.read")
  dashboard(@Req() request: AuthenticatedRequest) {
    return this.customer.dashboard(request.user!.id, request.tenantId!);
  }

  @Get("business")
  @UseGuards(AuthGuard, TenantContextGuard, PermissionGuard)
  @Permissions("business.read")
  business(@Req() request: AuthenticatedRequest) {
    return this.customer.business(request.tenantId!);
  }

  @Patch("business")
  @UseGuards(AuthGuard, TenantContextGuard, PermissionGuard)
  @Permissions("business.update")
  updateBusiness(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateBusinessDto,
  ) {
    return this.customer.updateBusiness(request.tenantId!, dto);
  }

  @Get("settings")
  @UseGuards(AuthGuard, TenantContextGuard, PermissionGuard)
  @Permissions("settings.read")
  settings(@Req() request: AuthenticatedRequest) {
    return this.customer.settings(request.tenantId!);
  }

  @Patch("settings")
  @UseGuards(AuthGuard, TenantContextGuard, PermissionGuard)
  @Permissions("settings.update")
  updateSettings(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.customer.updateSettings(request.tenantId!, dto);
  }

  @Get("team/summary")
  @UseGuards(AuthGuard, TenantContextGuard, PermissionGuard)
  @Permissions("team.summary.read")
  teamSummary(@Req() request: AuthenticatedRequest) {
    return this.customer.teamSummary(request.tenantId!);
  }
}
