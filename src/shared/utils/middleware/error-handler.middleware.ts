import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { Result } from 'oxide.ts';
import { container } from 'tsyringe';
import { ZodError } from 'zod';

import { DomainError } from '@/domain/errors/base-errors';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { AppError } from '@/shared/errors/app-error';

interface ErrorResponse {
  error: {
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
    // Get logger from DI container
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
    // Add request ID for tracing
    const requestId = request.id || 'unknown';

    // Log the error with context
    this.logError(error, request, requestId);

    // Check if response was already sent
    if (reply.sent) {
      return;
    }

    // Handle Fastify validation errors FIRST (they have a specific structure)
    if (this.isFastifyValidationError(error)) {
      return this.handleFastifyValidationError(error, reply, requestId);
    }

    // Handle different error types
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

    // Default to internal server error
    return this.handleUnknownError(error, reply, requestId);
  };

  /**
   * Check if error is a Fastify validation error
   */
  private isFastifyValidationError(error: any): boolean {
    return (
      error?.validation !== undefined ||
      error?.validationContext !== undefined ||
      (error?.statusCode === 400 && error?.code === 'FST_ERR_VALIDATION')
    );
  }

  /**
   * Handle Fastify validation errors (schema validation)
   */
  private handleFastifyValidationError(
    error: any,
    reply: FastifyReply,
    requestId: string
  ): void {
    const validationErrors: ValidationErrorDetail[] = [];

    // Parse validation errors based on Fastify's structure
    if (error.validation) {
      error.validation.forEach((validationError: any) => {
        const field = validationError.instancePath
          ? validationError.instancePath.replace(/^\//, '').replace(/\//g, '.')
          : validationError.dataPath?.replace(/^\./, '') || 'unknown';

        const message = validationError.message || 'Validation failed';

        validationErrors.push({
          field: field || validationError.params?.missingProperty || 'body',
          message: message,
          value: validationError.params?.allowedValues || undefined,
        });
      });
    } else {
      // Fallback for different validation error formats
      const message = error.message || 'Validation failed';

      // Try to extract field from error message (e.g., "body must have required property 'campaignId'")
      const fieldMatch = message.match(/property '([^']+)'/);
      const field = fieldMatch ? fieldMatch[1] : 'body';

      validationErrors.push({
        field: field,
        message: message,
      });
    }

    const response: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: validationErrors,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    reply.status(400).send(response);
  }

  /**
   * Handle AppError instances
   */
  private handleAppError(
    error: AppError,
    reply: FastifyReply,
    requestId: string
  ): void {
    const response: ErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp.toISOString(),
        requestId,
      },
    };

    reply.status(error.statusCode).send(response);
  }

  /**
   * Handle DomainError instances
   */
  private handleDomainError(
    error: DomainError,
    reply: FastifyReply,
    requestId: string
  ): void {
    const response: ErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    reply.status(error.statusCode).send(response);
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

        // For invalid_union errors, the expected values are in unionErrors
        if (issue.code === 'invalid_union') {
          value = 'Invalid union value';
        }
        // For invalid_type errors with expected enum, extract the options
        else if (issue.code === 'invalid_type' && issue.expected === 'string') {
          // Check if this is an enum error by looking at the message
          if (issue.message.includes('expected')) {
            value = issue.message;
          }
        }
        // For custom errors that might be enums
        else if (issue.code === 'custom' && (issue as any).params?.options) {
          value = (issue as any).params.options.join(', ');
        }

        return {
          field: issue.path.join('.') || 'unknown',
          message: issue.message,
          value,
        };
      }
    );

    const response: ErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: validationErrors,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    reply.status(400).send(response);
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

    // Special handling for rate limit errors
    if (error.code === 'FST_ERR_RATE_LIMIT') {
      const response: ErrorResponse = {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      reply.status(429).send(response);
      return;
    }

    const response: ErrorResponse = {
      error: {
        code: error.code || 'FASTIFY_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    reply.status(statusCode).send(response);
  }

  /**
   * Handle unknown errors
   */
  private handleUnknownError(
    error: any,
    reply: FastifyReply,
    requestId: string
  ): void {
    // Log unknown errors as they might indicate bugs
    this.logger.error('Unknown error occurred', {
      error,
      requestId,
      stack: error?.stack,
      errorType: typeof error,
      errorString: String(error),
    });

    const response: ErrorResponse = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    reply.status(500).send(response);
  }

  /**
   * Log errors with appropriate context
   */
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

    // Determine if it's an operational error
    const isOperational =
      error instanceof AppError
        ? error.isOperational
        : error instanceof DomainError
          ? true
          : this.isFastifyValidationError(error)
            ? true
            : error?.statusCode && error.statusCode < 500
              ? true
              : false;

    if (isOperational) {
      // Log operational errors as warnings
      this.logger.warn(
        `Operational error: ${error?.message || 'Unknown error'}`,
        errorContext
      );
    } else {
      // Log non-operational errors as errors with the error object
      this.logger.error(
        'Unexpected error occurred',
        error instanceof Error ? error : errorContext
      );
    }
  }

  /**
   * Check if error is a Fastify error
   */
  private isFastifyError(error: any): boolean {
    return (
      error && typeof error.statusCode === 'number' && error.code !== undefined
    );
  }
}
