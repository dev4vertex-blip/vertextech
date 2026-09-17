import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";

import { AuthGuard } from "../authorization/auth.guard.js";
import { AuthenticatedRequest } from "../authorization/authorization.types.js";
import { TenantContextGuard } from "../authorization/tenant-context.guard.js";
import { PermissionGuard } from "../authorization/permission.guard.js";
import { Permissions } from "../authorization/decorators.js";
import { CustomerService } from "./customer.service.js";
import { UpdateBusinessDto, UpdateSettingsDto } from "./dto.js";
import {
  InviteTeamMemberDto,
  TeamListQueryDto,
  UpdateTeamMemberDto,
  UpdateTeamMemberStatusDto,
} from "./dto.js";
import { TeamService } from "./team.service.js";

@Controller("customer")
export class CustomerController {
  constructor(
    private readonly customer: CustomerService,
    private readonly team: TeamService,
  ) {}

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

  @Get("team")
  @UseGuards(AuthGuard, TenantContextGuard, PermissionGuard)
  @Permissions("users.read")
  teamList(
    @Req() request: AuthenticatedRequest,
    @Query() query: TeamListQueryDto,
  ) {
    return this.team.list(request.tenantId!, query);
  }

  @Get("team/:userId")
  @UseGuards(AuthGuard, TenantContextGuard, PermissionGuard)
  @Permissions("users.read")
  teamMember(
    @Req() request: AuthenticatedRequest,
    @Param("userId") userId: string,
  ) {
    return this.team.member(request.tenantId!, userId);
  }

  @Post("team/invite")
  @UseGuards(AuthGuard, TenantContextGuard, PermissionGuard)
  @Permissions("team.manage")
  invite(
    @Req() request: AuthenticatedRequest,
    @Body() dto: InviteTeamMemberDto,
  ) {
    return this.team.invite(request.tenantId!, request.user!.id, dto);
  }

  @Patch("team/:userId")
  @UseGuards(AuthGuard, TenantContextGuard, PermissionGuard)
  @Permissions("team.manage")
  updateMember(
    @Req() request: AuthenticatedRequest,
    @Param("userId") userId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.team.update(request.tenantId!, userId, dto);
  }

  @Patch("team/:userId/status")
  @UseGuards(AuthGuard, TenantContextGuard, PermissionGuard)
  @Permissions("team.manage")
  updateMemberStatus(
    @Req() request: AuthenticatedRequest,
    @Param("userId") userId: string,
    @Body() dto: UpdateTeamMemberStatusDto,
  ) {
    return this.team.updateStatus(request.tenantId!, userId, dto.status);
  }

  @Delete("team/:userId")
  @UseGuards(AuthGuard, TenantContextGuard, PermissionGuard)
  @Permissions("team.manage")
  removeMember(
    @Req() request: AuthenticatedRequest,
    @Param("userId") userId: string,
  ) {
    return this.team.remove(request.tenantId!, userId);
  }
}
