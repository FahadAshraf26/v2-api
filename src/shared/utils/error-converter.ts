import { Result } from 'oxide.ts';

import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/shared/errors';

export class ErrorConverter {
  static fromResult(result: Result<any, Error>): AppError {
    const error = result.unwrapErr();

    // Check if it's already an AppError
    if (error instanceof AppError) {
      return error;
    }

    // Convert based on error message patterns
    const message = error.message.toLowerCase();

    if (message.includes('not found')) {
      return new NotFoundError(error.message);
    }

    if (message.includes('already exists') || message.includes('duplicate')) {
      return new ConflictError(error.message);
    }

    if (message.includes('invalid') || message.includes('validation')) {
      return new ValidationError(error.message);
    }

    if (
      message.includes('unauthorized') ||
      message.includes('authentication')
    ) {
      return new UnauthorizedError(error.message);
    }

    if (message.includes('forbidden') || message.includes('permission')) {
      return new ForbiddenError(error.message);
    }

    // Default to AppError
    return new AppError(error.message, 500, 'DOMAIN_ERROR');
  }
}
