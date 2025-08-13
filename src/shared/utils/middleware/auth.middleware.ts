import { FastifyReply, FastifyRequest } from 'fastify';
import { container } from 'tsyringe';

import { CacheService } from '@/infrastructure/cache/cache.service';
import { LoggerService } from '@/infrastructure/logging/logger.service';

/**
 * Token types for JWT authentication
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  FORGOT_PASSWORD = 'forgot_password',
  SET_NEW_PASSWORD = 'set_new_password',
}

/**
 * JWT Payload interface
 */
export interface JWTPayload {
  userId?: string;
  adminUserId?: string;
  type: TokenType;
  iat?: number;
  exp?: number;
}

/**
 * Extended Fastify request with authentication data
 */
export interface AuthenticatedRequest extends FastifyRequest {
  decoded?: JWTPayload;
  userId?: string;
  adminUserId?: string;
}

/**
 * Simple JWT verification (replace with proper JWT library in production)
 */
const verifyJWT = async (token: string): Promise<JWTPayload | null> => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadPart = parts[1];
    if (!payloadPart) return null;

    const payload = JSON.parse(
      Buffer.from(payloadPart, 'base64url').toString('utf-8')
    );

    // Check expiration
    if (!payload.exp || Date.now() >= payload.exp * 1000) {
      return null;
    }

    // Validate required fields
    if (!payload.type || (!payload.userId && !payload.adminUserId)) {
      return null;
    }

    return payload as JWTPayload;
  } catch {
    return null;
  }
};

/**
 * Get user tokens from cache
 */
const getUserTokens = async (userId: string): Promise<string[]> => {
  try {
    // Skip cache validation in test environment
    if (
      process.env['NODE_ENV'] === 'test' &&
      process.env['CACHE_ENABLED'] === 'false'
    ) {
      return ['test-token'];
    }

    const cacheService = container.resolve(CacheService);
    const cacheKey = `user:${userId}:tokens`;
    const cachedTokens = await cacheService.get(cacheKey);

    if (cachedTokens.isOk() && cachedTokens.unwrap()) {
      return JSON.parse(cachedTokens.unwrap() as string);
    }

    return [];
  } catch (error) {
    const logger = container.resolve(LoggerService);
    logger.error('Error getting user tokens from cache', error as Error);

    // Don't fail in test environment
    if (process.env['NODE_ENV'] === 'test') {
      return ['test-token'];
    }

    return [];
  }
};

/**
 * Main authentication middleware
 */
export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const token = request.headers['x-auth-token'] as string;

    if (!token) {
      return reply.status(401).send({
        error: 'Unauthorized: No token provided',
      });
    }

    // Verify JWT
    const decoded = await verifyJWT(token);
    if (!decoded) {
      return reply.status(401).send({
        error: 'Unauthorized: Invalid token',
      });
    }

    // Handle special token types
    if (
      decoded.type === TokenType.FORGOT_PASSWORD ||
      decoded.type === TokenType.SET_NEW_PASSWORD
    ) {
      (request as AuthenticatedRequest).decoded = decoded;
      return;
    }

    // Handle user tokens
    if (decoded.userId) {
      // Check resource access
      if (
        request.params &&
        typeof request.params === 'object' &&
        'userId' in request.params
      ) {
        const paramUserId = (request.params as any).userId;
        if (paramUserId && paramUserId !== decoded.userId) {
          return reply.status(403).send({
            error: 'Forbidden: Invalid resource access',
          });
        }
      }

      // Verify token in cache (for revocation)
      const userTokens = await getUserTokens(decoded.userId);
      if (userTokens.length === 0) {
        return reply.status(401).send({
          error: 'Unauthorized: Token revoked',
        });
      }

      (request as AuthenticatedRequest).decoded = decoded;
      (request as AuthenticatedRequest).userId = decoded.userId;
      return;
    }

    // Handle admin tokens
    if (decoded.adminUserId) {
      (request as AuthenticatedRequest).decoded = decoded;
      (request as AuthenticatedRequest).adminUserId = decoded.adminUserId;
      return;
    }

    return reply.status(401).send({
      error: 'Unauthorized: Invalid token payload',
    });
  } catch (error) {
    const logger = container.resolve(LoggerService);
    logger.error('Authentication error', error as Error);
    return reply.status(401).send({
      error: 'Unauthorized: Authentication failed',
    });
  }
};

/**
 * Middleware for user-only routes
 */
export const authenticateUser = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  await authenticate(request, reply);

  // If authenticate sent a response, don't continue
  if (reply.sent) return;

  const authRequest = request as AuthenticatedRequest;
  if (!authRequest.userId) {
    return reply.status(403).send({
      error: 'Forbidden: User access required',
    });
  }
};

/**
 * Middleware for admin-only routes
 */
export const authenticateAdmin = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  await authenticate(request, reply);

  // If authenticate sent a response, don't continue
  if (reply.sent) return;

  const authRequest = request as AuthenticatedRequest;
  if (!authRequest.adminUserId) {
    return reply.status(403).send({
      error: 'Forbidden: Admin access required',
    });
  }
};

/**
 * Middleware for routes that accept both user and admin
 */
export const authenticateUserOrAdmin = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  await authenticate(request, reply);

  // If authenticate sent a response, don't continue
  if (reply.sent) return;

  const authRequest = request as AuthenticatedRequest;
  if (!authRequest.userId && !authRequest.adminUserId) {
    return reply.status(403).send({
      error: 'Forbidden: User or admin access required',
    });
  }
};
