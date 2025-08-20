// src/shared/utils/middleware/auth.middleware.ts
// Fully compatible with V1 tokens and Redis structure
import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { container } from 'tsyringe';

import { ConfigService } from '@/config/config.service';

import { CacheService } from '@/infrastructure/cache/cache.service';
import { LoggerService } from '@/infrastructure/logging/logger.service';

export type AuthHook = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

export interface AuthMiddleware {
  authenticate: AuthHook;
  authenticateUser: AuthHook;
  authenticateAdmin: AuthHook;
  authenticateUserOrAdmin: AuthHook;
}

/**
 * Token types matching V1
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  FORGOT_PASSWORD = 'forgotPassword',
  SET_NEW_PASSWORD = 'SET_NEW_PASSWORD',
}

/**
 * JWT Payload interface - V1 structure
 */
export interface JWTPayload {
  // V1 user tokens have these fields
  email?: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  investorId?: string;
  isEmailVerified?: boolean;
  isVerified?: boolean;

  // Admin tokens might have this
  adminUserId?: string;

  // Token metadata
  type?: string;
  iat?: number;
  exp?: number;
}

/**
 * Admin user interface
 */
export interface AdminUser {
  id: string;
}

/**
 * Extended Fastify request with authentication data
 */
export interface AuthenticatedRequest extends FastifyRequest {
  decoded?: JWTPayload;
  userId?: string;
  adminUserId?: string;
  adminUser?: AdminUser;
}

/**
 * Helper function to send JSON error response
 */
const sendErrorResponse = (
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string
): void => {
  const errorResponse = {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
    },
  };

  reply
    .code(statusCode)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send(JSON.stringify(errorResponse));
};

interface RequestParams {
  userId?: string;
}

export function createAuthMiddleware(
  configService: ConfigService
): AuthMiddleware {
  const logger = container.resolve(LoggerService);

  const decodeJWT = async (token: string): Promise<JWTPayload | null> => {
    try {
      const secret = configService.get('SECRET') || '';
      const decoded = jwt.verify(token, secret) as JWTPayload;

      logger.debug('Token decoded successfully', {
        hasUserId: !!decoded.userId,
        hasAdminUserId: !!decoded.adminUserId,
        hasEmail: !!decoded.email,
        exp: decoded.exp,
      });

      return decoded;
    } catch (error: unknown) {
      const err = error as { message: string; name: string };
      logger.debug('JWT verification failed', {
        error: err.message,
        name: err.name,
      });
      return null;
    }
  };

  const getTokens = async (userId: string): Promise<string[]> => {
    try {
      if (
        configService.get('NODE_ENV') === 'test' &&
        !configService.get('CACHE_ENABLED')
      ) {
        return ['test-token'];
      }

      const cacheService = container.resolve(CacheService);

      const simpleKey = `user:${userId}:tokens`;
      const simpleResult = await cacheService.get<string[] | string>(simpleKey);

      if (simpleResult.isOk() && simpleResult.unwrap()) {
        const tokens = simpleResult.unwrap();
        if (Array.isArray(tokens)) {
          logger.debug('Found tokens array in simple key', {
            count: tokens.length,
          });
          return tokens;
        }
        if (typeof tokens === 'string') {
          try {
            const parsed = JSON.parse(tokens);
            if (Array.isArray(parsed)) {
              logger.debug('Found tokens JSON array in simple key', {
                count: parsed.length,
              });
              return parsed;
            }
          } catch {
            return [tokens];
          }
        }
      }

      logger.debug('No tokens found for user', { userId });
      return [];
    } catch (error) {
      logger.error('Error getting user tokens from cache', error as Error);

      if (configService.get('NODE_ENV') === 'test') {
        return ['test-token'];
      }

      return [];
    }
  };

  const authenticate = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      const token = request.headers['x-auth-token'] as string;

      if (!token) {
        logger.debug('No token provided in x-auth-token header');
        return sendErrorResponse(reply, 401, 'NO_TOKEN', 'Unauthorized');
      }

      const decoded = await decodeJWT(token);

      if (!decoded) {
        logger.debug('Token decode/verification failed');
        return sendErrorResponse(reply, 401, 'INVALID_TOKEN', 'Unauthorized');
      }

      if (decoded.type === TokenType.FORGOT_PASSWORD) {
        (request as AuthenticatedRequest).decoded = decoded;
        return;
      }

      if (decoded.type === TokenType.SET_NEW_PASSWORD) {
        (request as AuthenticatedRequest).decoded = decoded;
        return;
      }

      if (decoded.userId) {
        if (
          request.params &&
          typeof request.params === 'object' &&
          'userId' in request.params
        ) {
          const paramUserId = (request.params as RequestParams).userId;
          if (paramUserId && paramUserId !== decoded.userId) {
            logger.warn('Invalid resource access attempt', {
              tokenUserId: decoded.userId,
              paramUserId,
            });
            return sendErrorResponse(
              reply,
              401,
              'INVALID_RESOURCE',
              'Unauthorized'
            );
          }
        }

        const tokens = await getTokens(decoded.userId);

        if (tokens.length === 0) {
          logger.warn('No active tokens found for user', {
            userId: decoded.userId,
          });

          return sendErrorResponse(
            reply,
            401,
            'NO_ACTIVE_TOKENS',
            'Unauthorized'
          );
        }

        (request as AuthenticatedRequest).decoded = decoded;
        (request as AuthenticatedRequest).userId = decoded.userId;

        logger.debug('User authenticated successfully', {
          userId: decoded.userId,
          email: decoded.email,
        });

        return;
      }

      if (decoded.adminUserId) {
        (request as AuthenticatedRequest).decoded = decoded;
        (request as AuthenticatedRequest).adminUserId = decoded.adminUserId;

        (request as AuthenticatedRequest).adminUser = {
          id: decoded.adminUserId,
        };

        logger.debug('Admin authenticated successfully', {
          adminUserId: decoded.adminUserId,
        });

        return;
      }

      logger.warn('Token missing userId or adminUserId');
      return sendErrorResponse(reply, 401, 'INVALID_TOKEN', 'Unauthorized');
    } catch (error) {
      logger.error('Authentication error', error as Error);
      return sendErrorResponse(reply, 401, 'AUTH_ERROR', 'Unauthorized');
    }
  };

  const authenticateUser = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    await authenticate(request, reply);
    if (reply.sent) return;
    const authRequest = request as AuthenticatedRequest;
    if (!authRequest.userId) {
      return sendErrorResponse(
        reply,
        403,
        'USER_REQUIRED',
        'Forbidden: User access required'
      );
    }
  };

  const authenticateAdmin = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    await authenticate(request, reply);
    if (reply.sent) return;
    const authRequest = request as AuthenticatedRequest;
    if (!authRequest.adminUserId) {
      return sendErrorResponse(
        reply,
        403,
        'ADMIN_REQUIRED',
        'Forbidden: Admin access required'
      );
    }
  };

  const authenticateUserOrAdmin = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    await authenticate(request, reply);
    if (reply.sent) return;
    const authRequest = request as AuthenticatedRequest;
    if (!authRequest.userId && !authRequest.adminUserId) {
      return sendErrorResponse(
        reply,
        403,
        'AUTH_REQUIRED',
        'Forbidden: User or admin access required'
      );
    }
  };

  return {
    authenticate,
    authenticateUser,
    authenticateAdmin,
    authenticateUserOrAdmin,
  };
}
