import { Injectable, LoggerService } from "@nestjs/common";

import { LogLevel } from "../../config/app-config.js";

@Injectable()
export class StructuredLogger implements LoggerService {
  constructor(private readonly minimumLevel: LogLevel = "info") {}

  log(message: unknown, context?: string): void {
    this.write("info", message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write("error", message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.write("warn", message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write("debug", message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write("debug", message, context);
  }

  private write(
    level: Exclude<LogLevel, "info"> | "info",
    message: unknown,
    context?: string,
    trace?: string,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message: message instanceof Error ? message.message : message,
      ...(trace ? { trace } : {}),
    };

    const output = JSON.stringify(entry);
    if (level === "error") {
      console.error(output);
    } else if (level === "warn") {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  private shouldLog(level: Exclude<LogLevel, "info"> | "info"): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.minimumLevel);
  }
}
