import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";
import { StructuredLogger } from "./common/logging/structured-logger.js";
import { HttpExceptionFilter } from "./common/http/http-exception.filter.js";
import { AppConfig } from "./config/app-config.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(AppConfig);

  app.useLogger(new StructuredLogger(config.logLevel));
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: config.corsOrigins === "*" ? true : config.corsOrigins,
    credentials: config.corsOrigins !== "*",
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(config.port);
}

void bootstrap();
