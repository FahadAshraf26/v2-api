import {
  FastifyError,
  FastifyReply,
  FastifyRequest,
  FastifySchemaValidationError,
} from 'fastify';
import { container } from 'tsyringe';
import { ZodError } from 'zod';

import { DomainError } from '@/domain/errors/base-errors';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { AppError } from '@/shared/errors/app-error';
import { ResponseUtil } from '@/shared/utils/response/response';

interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export class ErrorHandlerMiddleware {
  private logger: LoggerService;

  constructor() {
    this.logger = container.resolve(LoggerService);
  }

  /**
   * Global error handler for Fastify
   */
  public handleError(
    error: Error,
    request: FastifyRequest,
    reply: FastifyReply
  ): void {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else {
      // For simplicity, we'll treat unknown errors as internal server errors
      appError = new AppError(error.message, 500, 'INTERNAL_ERROR');
    }

    if (!appError.isOperational) {
      this.logger.error('CRITICAL ERROR:', appError);
      // In a real-world scenario, you might want to gracefully shutdown
      process.exit(1);
    }

    ResponseUtil.error(reply, appError, request.id);
  }

  /**
   * Handle Fastify validation errors (schema validation)
   */
  private handleFastifyValidationError(
    error: FastifyError,
    reply: FastifyReply,
    requestId: string | undefined
  ): void {
    const validationErrors: ValidationError[] = [];

    if (error.validation && Array.isArray(error.validation)) {
      error.validation.forEach(
        (validationError: FastifySchemaValidationError) => {
          let field = 'unknown';

          if (validationError.instancePath) {
            field = validationError.instancePath
              .replace(/^\//, '')
              .replace(/\//g, '.');
          }

          if (
            validationError.params['missingProperty'] &&
            typeof validationError.params['missingProperty'] === 'string'
          ) {
            field = validationError.params['missingProperty'];
          } else if (validationError.schemaPath) {
            const schemaMatch =
              validationError.schemaPath.match(/properties\/([^/]+)/);
            if (schemaMatch && schemaMatch[1]) {
              field = schemaMatch[1];
            }
          }

          if (field === 'unknown' && validationError.message) {
            const msgMatch =
              validationError.message.match(/property '([^']+)'/);
            if (msgMatch && msgMatch[1]) {
              field = msgMatch[1];
            }
          }

          const message = validationError.message || 'Validation failed';

          validationErrors.push({
            field: field || 'body',
            message: message,
            value: validationError.params['allowedValues'] || undefined,
          });
        }
      );
    } else {
      const message = error.message || 'Validation failed';
      let field = 'body';

      const propertyMatch = message.match(/property '([^']+)'/);
      if (propertyMatch && propertyMatch[1]) {
        field = propertyMatch[1];
      } else if (message.includes('body/')) {
        const pathMatch = message.match(/body\/([^/]+)/);
        if (pathMatch && pathMatch[1]) {
          field = pathMatch[1];
        }
      } else if (message.includes(' is required')) {
        const fieldMatch = message.match(/^(\w+) is required/);
        if (fieldMatch && fieldMatch[1]) {
          field = fieldMatch[1];
        }
      }

      validationErrors.push({
        field: field,
        message: message,
      });
    }

    const appError = new AppError(
      'Request validation failed',
      400,
      'VALIDATION_ERROR',
      true,
      validationErrors
    );
    ResponseUtil.error(reply, appError, requestId);
  }

  /**
   * Handle DomainError instances
   */
  private handleDomainError(
    error: DomainError,
    reply: FastifyReply,
    requestId: string | undefined
  ): void {
    const appError = new AppError(
      error.message,
      error.statusCode,
      error.code,
      true
    );
    ResponseUtil.error(reply, appError, requestId);
  }

  /**
   * Handle Zod validation errors
   */
  private handleZodValidationError(
    error: ZodError,
    reply: FastifyReply,
    requestId: string | undefined
  ): void {
    const validationErrors = error.issues.map(issue => ({
      field: issue.path.join('.') || 'unknown',
      message: issue.message,
    }));

    const appError = new AppError(
      'Request validation failed',
      400,
      'VALIDATION_ERROR',
      true,
      validationErrors
    );
    ResponseUtil.error(reply, appError, requestId);
  }

  /**
   * Handle general Fastify errors
   */
  private handleFastifyError(
    error: FastifyError,
    reply: FastifyReply,
    requestId: string | undefined
  ): void {
    let appError: AppError;

    switch (error.statusCode) {
      case 429:
        appError = new AppError(
          'Too many requests',
          429,
          'RATE_LIMIT_EXCEEDED',
          true
        );
        break;
      default:
        appError = new AppError(
          error.message,
          error.statusCode || 500,
          error.code || 'FASTIFY_ERROR',
          true
        );
        break;
    }
    ResponseUtil.error(reply, appError, requestId);
  }

  /**
   * Handle unknown errors
   */
  private handleUnknownError(
    error: unknown,
    reply: FastifyReply,
    requestId: string | undefined
  ): void {
    const unknownError =
      error instanceof Error ? error : new Error('An unknown error occurred');
    const appError = new AppError(unknownError.message, 500, 'INTERNAL_ERROR');
    ResponseUtil.error(reply, appError, requestId);
  }

  private logError(
    error: Error,
    request: FastifyRequest,
    requestId: string | undefined
  ): void {
    const logger = container.resolve<LoggerService>(LoggerService);

    const logDetails: Record<string, unknown> = {
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

    const isOperational = error instanceof AppError && error.isOperational;

    if (isOperational) {
      logger.warn(error.message, logDetails);
    } else {
      logger.error('Unhandled error', logDetails);
    }
  }

  private isFastifyError(error: Error): boolean {
    return (
      'statusCode' in error &&
      typeof error.statusCode === 'number' &&
      'code' in error
    );
  }
}
