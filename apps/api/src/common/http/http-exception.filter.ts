import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const body: ErrorResponse = {
      statusCode,
      error: this.getErrorName(exceptionResponse, statusCode),
      message: this.getMessage(exceptionResponse, statusCode),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }

  private getErrorName(response: unknown, statusCode: number): string {
    if (
      typeof response === "object" &&
      response !== null &&
      "error" in response
    ) {
      const error = response.error;
      if (typeof error === "string") {
        return error;
      }
    }

    return statusCode >= 500 ? "Internal Server Error" : "Request Error";
  }

  private getMessage(response: unknown, statusCode: number): string | string[] {
    if (typeof response === "string") {
      return response;
    }

    if (
      typeof response === "object" &&
      response !== null &&
      "message" in response
    ) {
      const message = response.message;
      if (typeof message === "string" || Array.isArray(message)) {
        return message;
      }
    }

    return statusCode >= 500 ? "Internal server error" : "Request failed";
  }
}
