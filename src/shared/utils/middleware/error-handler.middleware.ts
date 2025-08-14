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
    if (error.validation && Array.isArray(error.validation)) {
      error.validation.forEach((validationError: any) => {
        // Try multiple ways to extract the field name
        let field = 'unknown';

        // Method 1: From instancePath (e.g., "/campaignId")
        if (validationError.instancePath) {
          field = validationError.instancePath
            .replace(/^\//, '')
            .replace(/\//g, '.');
        }
        // Method 2: From dataPath (older format)
        else if (validationError.dataPath) {
          field = validationError.dataPath.replace(/^\./, '');
        }
        // Method 3: From params.missingProperty (for required fields)
        else if (validationError.params?.missingProperty) {
          field = validationError.params.missingProperty;
        }
        // Method 4: From schemaPath (e.g., "#/properties/campaignId/required")
        else if (validationError.schemaPath) {
          const schemaMatch =
            validationError.schemaPath.match(/properties\/([^/]+)/);
          if (schemaMatch) {
            field = schemaMatch[1];
          }
        }

        // If still unknown and message mentions a property, extract from message
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
      // Fallback for simple error messages
      const message = error.message || 'Validation failed';

      // Enhanced field extraction from error message
      let field = 'body';

      // Pattern 1: "body must have required property 'campaignId'"
      const propertyMatch = message.match(/property '([^']+)'/);
      if (propertyMatch) {
        field = propertyMatch[1];
      }
      // Pattern 2: "body/campaignId must be..."
      else if (message.includes('body/')) {
        const pathMatch = message.match(/body\/([^\s]+)/);
        if (pathMatch) {
          field = pathMatch[1];
        }
      }
      // Pattern 3: Direct field mention "campaignId is required"
      else if (message.includes(' is required')) {
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

    // Create the response object
    const responseObj = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: validationErrors,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    // Explicitly stringify the response to ensure proper serialization
    const responseString = JSON.stringify(responseObj);

    // Send as JSON string with proper headers
    reply
      .code(400)
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
    const responseObj = {
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
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
    this.logger.error('Unknown error occurred', {
      error,
      requestId,
      stack: error?.stack,
      errorType: typeof error,
      errorString: String(error),
    });

    const responseObj = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    const responseString = JSON.stringify(responseObj);

    reply
      .code(500)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(responseString);
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
