import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "@vertex/database";

import { TenantContextMiddleware } from "./common/tenant/tenant-context.middleware.js";
import { appConfig } from "./config/app-config.js";
import { AppConfigModule } from "./config/config.module.js";
import { HealthModule } from "./health/health.module.js";
import { validateEnvironment } from "./config/environment.validation.js";
import { AuthModule } from "./modules/auth/auth.module.js";

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
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantContextMiddleware)
      .forRoutes({ path: "{*path}", method: RequestMethod.ALL });
  }
}
