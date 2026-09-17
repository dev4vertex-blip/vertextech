import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "@vertex/database";

import { appConfig } from "./config/app-config.js";
import { AppConfigModule } from "./config/config.module.js";
import { HealthModule } from "./health/health.module.js";
import { validateEnvironment } from "./config/environment.validation.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { CustomerModule } from "./modules/customer/customer.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [appConfig],
      validate: validateEnvironment,
    }),
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    CustomerModule,
    HealthModule,
  ],
})
export class AppModule {}
