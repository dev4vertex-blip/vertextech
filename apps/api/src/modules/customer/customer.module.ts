import { Module } from "@nestjs/common";
import { DatabaseModule } from "@vertex/database";

import { AuthorizationModule } from "../authorization/authorization.module.js";
import { CustomerController } from "./customer.controller.js";
import { CustomerService } from "./customer.service.js";
import { TeamService } from "./team.service.js";
import {
  DevelopmentInvitationProvider,
  INVITATION_PROVIDER,
} from "./invitation.provider.js";

@Module({
  imports: [DatabaseModule, AuthorizationModule],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    TeamService,
    {
      provide: INVITATION_PROVIDER,
      useClass: DevelopmentInvitationProvider,
    },
  ],
})
export class CustomerModule {}
