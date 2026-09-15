import { Controller, Get } from "@nestjs/common";

import { AppConfig } from "../config/app-config.js";

interface HealthResponse {
  status: "ok";
  timestamp: string;
  uptime: number;
  environment: string;
}

@Controller("health")
export class HealthController {
  constructor(private readonly config: AppConfig) {}

  @Get()
  getHealth(): HealthResponse {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.config.nodeEnv,
    };
  }
}
