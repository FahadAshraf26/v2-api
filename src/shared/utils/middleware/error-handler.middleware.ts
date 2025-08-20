// src/shared/utils/middleware/error-handler.middleware.ts
// Updated version with statusCode in all error responses
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { Result } from 'oxide.ts';
import { container } from 'tsyringe';
import { ZodError } from 'zod';

import { DomainError } from '@/domain/errors/base-errors';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { AppError } from '@/shared/errors/app-error';

import { ResponseUtil } from '../response/response';

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
      return ResponseUtil.error(reply, error, requestId);
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
    const validationErrors: any[] = [];

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
    requestId: string
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
    requestId: string
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
    requestId: string
  ): void {
    const statusCode = error.statusCode || 500;
    const code = error.code || 'FASTIFY_ERROR';
    const message = error.message;

    if (code === 'FST_ERR_RATE_LIMIT') {
      const appError = new AppError(
        'Too many requests',
        429,
        'RATE_LIMIT_EXCEEDED',
        true
      );
      return ResponseUtil.error(reply, appError, requestId);
    }

    const appError = new AppError(message, statusCode, code, true);
    ResponseUtil.error(reply, appError, requestId);
  }

  /**
   * Handle unknown errors
   */
  private handleUnknownError(
    error: any,
    reply: FastifyReply,
    requestId: string
  ): void {
    const appError = new AppError(
      'An unexpected error occurred',
      500,
      'INTERNAL_SERVER_ERROR',
      false
    );
    ResponseUtil.error(reply, appError, requestId);
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
