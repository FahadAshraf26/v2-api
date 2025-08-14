// src/shared/utils/middleware/error-handler.middleware.ts
// Updated version with statusCode in all error responses
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { Result } from 'oxide.ts';
import { container } from 'tsyringe';
import { ZodError } from 'zod';

import { DomainError } from '@/domain/errors/base-errors';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { AppError } from '@/shared/errors/app-error';

interface ErrorResponse {
  error: {
    statusCode: number; // Include status code in response
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

export class ErrorHandlerMiddleware {
  private logger: LoggerService;

  constructor() {
    this.logger = container.resolve(LoggerService);
  }

  /**
   * Global error handler for Fastify
   */
  public handleError = async (
    error: any,
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const requestId = request.id || 'unknown';

    this.logError(error, request, requestId);

    if (reply.sent) {
      return;
    }

    // Check for Fastify validation errors
    if (
      error?.validation ||
      error?.validationContext ||
      (error?.statusCode === 400 &&
        (error?.message?.includes('required property') ||
          error?.message?.includes('must have') ||
          error?.message?.includes('must be'))) ||
      error?.code === 'FST_ERR_VALIDATION'
    ) {
      return this.handleFastifyValidationError(error, reply, requestId);
    }

    if (error instanceof AppError) {
      return this.handleAppError(error, reply, requestId);
    }

    if (error instanceof DomainError) {
      return this.handleDomainError(error, reply, requestId);
    }

    if (error instanceof ZodError) {
      return this.handleZodValidationError(error, reply, requestId);
    }

    if (this.isFastifyError(error)) {
      return this.handleFastifyError(error as FastifyError, reply, requestId);
    }

    return this.handleUnknownError(error, reply, requestId);
  };

  /**
   * Handle Fastify validation errors (schema validation)
   */
  private handleFastifyValidationError(
    error: any,
    reply: FastifyReply,
    requestId: string
  ): void {
    const validationErrors: ValidationErrorDetail[] = [];

    if (error.validation && Array.isArray(error.validation)) {
      error.validation.forEach((validationError: any) => {
        let field = 'unknown';

        if (validationError.instancePath) {
          field = validationError.instancePath
            .replace(/^\//, '')
            .replace(/\//g, '.');
        } else if (validationError.dataPath) {
          field = validationError.dataPath.replace(/^\./, '');
        } else if (validationError.params?.missingProperty) {
          field = validationError.params.missingProperty;
        } else if (validationError.schemaPath) {
          const schemaMatch =
            validationError.schemaPath.match(/properties\/([^/]+)/);
          if (schemaMatch) {
            field = schemaMatch[1];
          }
        }

        if (field === 'unknown' && validationError.message) {
          const msgMatch = validationError.message.match(/property '([^']+)'/);
          if (msgMatch) {
            field = msgMatch[1];
          }
        }

        const message = validationError.message || 'Validation failed';

        validationErrors.push({
          field: field || 'body',
          message: message,
          value: validationError.params?.allowedValues || undefined,
        });
      });
    } else {
      const message = error.message || 'Validation failed';
      let field = 'body';

      const propertyMatch = message.match(/property '([^']+)'/);
      if (propertyMatch) {
        field = propertyMatch[1];
      } else if (message.includes('body/')) {
        const pathMatch = message.match(/body\/([^\s]+)/);
        if (pathMatch) {
          field = pathMatch[1];
        }
      } else if (message.includes(' is required')) {
        const fieldMatch = message.match(/^(\w+) is required/);
        if (fieldMatch) {
          field = fieldMatch[1];
        }
      }

      validationErrors.push({
        field: field,
        message: message,
      });
    }

    const statusCode = 400;
    const responseObj = {
      error: {
        statusCode, // Include status code
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: validationErrors,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    const responseString = JSON.stringify(responseObj);

    reply
      .code(statusCode)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(responseString);
  }

  /**
   * Handle AppError instances
   */
  private handleAppError(
    error: AppError,
    reply: FastifyReply,
    requestId: string
  ): void {
    const responseObj = {
      error: {
        statusCode: error.statusCode, // Include status code
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp.toISOString(),
        requestId,
      },
    };

    const responseString = JSON.stringify(responseObj);

    reply
      .code(error.statusCode)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(responseString);
  }

  /**
   * Handle DomainError instances
   */
  private handleDomainError(
    error: DomainError,
    reply: FastifyReply,
    requestId: string
  ): void {
    const statusCode = error.statusCode;
    const responseObj = {
      error: {
        statusCode, // Include status code
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    const responseString = JSON.stringify(responseObj);

    reply
      .code(statusCode)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(responseString);
  }

  /**
   * Handle Zod validation errors
   */
  private handleZodValidationError(
    error: ZodError,
    reply: FastifyReply,
    requestId: string
  ): void {
    const validationErrors: ValidationErrorDetail[] = error.issues.map(
      issue => {
        let value: any = undefined;

        if (issue.code === 'invalid_union') {
          value = 'Invalid union value';
        } else if (
          issue.code === 'invalid_type' &&
          issue.expected === 'string'
        ) {
          if (issue.message.includes('expected')) {
            value = issue.message;
          }
        } else if (issue.code === 'custom' && (issue as any).params?.options) {
          value = (issue as any).params.options.join(', ');
        }

        return {
          field: issue.path.join('.') || 'unknown',
          message: issue.message,
          value,
        };
      }
    );

    const statusCode = 400;
    const responseObj = {
      error: {
        statusCode, // Include status code
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: validationErrors,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    const responseString = JSON.stringify(responseObj);

    reply
      .code(statusCode)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(responseString);
  }

  /**
   * Handle general Fastify errors
   */
  private handleFastifyError(
    error: FastifyError,
    reply: FastifyReply,
    requestId: string
  ): void {
    const statusCode = error.statusCode || 500;

    if (error.code === 'FST_ERR_RATE_LIMIT') {
      const responseObj = {
        error: {
          statusCode: 429, // Include status code
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          timestamp: new Date().toISOString(),
          requestId,
        },
      };

      const responseString = JSON.stringify(responseObj);

      reply
        .code(429)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send(responseString);
      return;
    }

    const responseObj = {
      error: {
        statusCode, // Include status code
        code: error.code || 'FASTIFY_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    const responseString = JSON.stringify(responseObj);

    reply
      .code(statusCode)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(responseString);
  }

  /**
   * Handle unknown errors
   */
  private handleUnknownError(
    error: any,
    reply: FastifyReply,
    requestId: string
  ): void {
    this.logger.error('Unknown error occurred', {
      error,
      requestId,
      stack: error?.stack,
      errorType: typeof error,
      errorString: String(error),
    });

    const statusCode = 500;
    const responseObj = {
      error: {
        statusCode, // Include status code
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    const responseString = JSON.stringify(responseObj);

    reply
      .code(statusCode)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(responseString);
  }

  private logError(
    error: any,
    request: FastifyRequest,
    requestId: string
  ): void {
    const errorContext = {
      requestId,
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      errorMessage: error?.message || 'Unknown error',
      errorStack: error?.stack,
    };

    const isOperational =
      error instanceof AppError
        ? error.isOperational
        : error instanceof DomainError
          ? true
          : error?.validation || error?.validationContext
            ? true
            : error?.statusCode && error.statusCode < 500
              ? true
              : false;

    if (isOperational) {
      this.logger.warn(
        `Operational error: ${error?.message || 'Unknown error'}`,
        errorContext
      );
    } else {
      this.logger.error(
        'Unexpected error occurred',
        error instanceof Error ? error : errorContext
      );
    }
  }

  private isFastifyError(error: any): boolean {
    return (
      error && typeof error.statusCode === 'number' && error.code !== undefined
    );
  }
}
