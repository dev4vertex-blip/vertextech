import { Module } from "@nestjs/common";
import { DatabaseModule } from "@vertex/database";

import { AuthorizationModule } from "../authorization/authorization.module.js";
import { CustomerController } from "./customer.controller.js";
import { CustomerService } from "./customer.service.js";

@Module({
  imports: [DatabaseModule, AuthorizationModule],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
