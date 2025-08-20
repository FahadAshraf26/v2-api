import { FastifyReply, FastifyRequest } from 'fastify';
import { Result } from 'oxide.ts';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { ForbiddenError, UnauthorizedError } from '@/shared/errors';
import { ErrorConverter } from '@/shared/utils/error-converter';
import { ResponseUtil } from '@/shared/utils/response/response';

/**
 * Base controller with built-in error handling
 */
export abstract class BaseController {
  constructor(protected readonly logger: LoggerService) {}

  /**
   * Execute controller action with error handling
   */
  protected async execute<T>(
    request: FastifyRequest,
    reply: FastifyReply,
    action: () => Promise<T>
  ): Promise<void> {
    try {
      const result = await action();

      if (this.isResult(result)) {
        if (result.isErr()) {
          throw ErrorConverter.fromResult(result);
        }

        const data = result.unwrap();
        if (data === undefined || data === null) {
          this.noContent(reply);
        } else if (
          typeof data === 'object' &&
          (data as any).success === true &&
          Object.keys(data).length === 1
        ) {
          this.ok(reply, undefined as any, 'Operation successful');
        } else {
          this.ok(reply, data);
        }
        return;
      }

      if (result !== undefined && result !== null) {
        this.ok(reply, result);
      } else {
        this.noContent(reply);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Standard success responses
   */
  protected ok<T>(reply: FastifyReply, data: T, message = 'Success'): void {
    ResponseUtil.success(reply, data, message);
  }

  protected created<T>(
    reply: FastifyReply,
    data: T,
    message = 'Resource created successfully'
  ): void {
    ResponseUtil.success(reply, data, message, 201);
  }

  protected noContent(reply: FastifyReply): void {
    reply.status(204).send();
  }

  /**
   * Check if user is authenticated
   */
  protected requireAuth(request: any): string {
    if (!request.userId) {
      throw new UnauthorizedError('User authentication required');
    }
    return request.userId;
  }

  /**
   * Check if admin is authenticated
   */
  protected requireAdmin(request: any): string {
    if (!request.adminUserId) {
      throw new ForbiddenError('Admin access required');
    }
    return request.adminUserId;
  }

  /**
   * Check if user has required role
   */
  protected requireRole(request: any, role: string): void {
    if (!request.userRole || request.userRole !== role) {
      throw new ForbiddenError(`Required role: ${role}`);
    }
  }

  private isResult<T>(value: any): value is Result<T, Error> {
    return (
      value && typeof value === 'object' && 'isOk' in value && 'isErr' in value
    );
  }
}
