import { Injectable } from "@nestjs/common";
import { registerAs } from "@nestjs/config";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface AppConfigValues {
  nodeEnv: string;
  port: number;
  corsOrigins: string[] | "*";
  logLevel: LogLevel;
}

export const appConfig = registerAs("app", (): AppConfigValues => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
  logLevel: parseLogLevel(process.env.LOG_LEVEL),
}));

@Injectable()
export class AppConfig {
  get nodeEnv(): string {
    return appConfig().nodeEnv;
  }

  get port(): number {
    return appConfig().port;
  }

  get corsOrigins(): string[] | "*" {
    return appConfig().corsOrigins;
  }

  get logLevel(): LogLevel {
    return appConfig().logLevel;
  }
}

function parseCorsOrigins(value: string | undefined): string[] | "*" {
  if (!value || value.trim() === "*") {
    return "*";
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function parseLogLevel(value: string | undefined): LogLevel {
  if (value === "debug" || value === "warn" || value === "error") {
    return value;
  }

  return "info";
}
