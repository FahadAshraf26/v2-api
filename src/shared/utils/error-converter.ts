import { Result } from 'oxide.ts';

import {
  AppError,
  BusinessRuleError,
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

    // Validation errors - check for multiple patterns
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      message.includes('cannot be null') ||
      message.includes('must be') ||
      message.includes('must have') ||
      message.includes('should be') ||
      message.includes('notnull violation') // Sequelize validation
    ) {
      return new ValidationError(error.message);
    }

    // Not found errors
    if (message.includes('not found') || message.includes('does not exist')) {
      return new NotFoundError(error.message);
    }

    // Conflict errors
    if (
      message.includes('already exists') ||
      message.includes('duplicate') ||
      message.includes('conflict') ||
      message.includes('unique constraint')
    ) {
      return new ConflictError(error.message);
    }

    // Authentication errors
    if (
      message.includes('unauthorized') ||
      message.includes('authentication') ||
      message.includes('not authenticated')
    ) {
      return new UnauthorizedError(error.message);
    }

    // Permission errors
    if (
      message.includes('forbidden') ||
      message.includes('permission') ||
      message.includes('access denied') ||
      message.includes('not authorized')
    ) {
      return new ForbiddenError(error.message);
    }

    // Business rule violations
    if (
      message.includes('cannot') ||
      message.includes('not allowed') ||
      message.includes('business rule')
    ) {
      return new BusinessRuleError(error.message);
    }

    // Default to AppError with 500 status
    // This should only happen for true unexpected errors
    return new AppError(error.message, 500, 'INTERNAL_ERROR');
  }

  /**
   * Convert database/Sequelize errors to AppErrors
   */
  static fromDatabaseError(error: any): AppError {
    const errorName = error.name || '';
    const message = error.message || 'Database error occurred';

    // Sequelize Validation Errors
    if (
      errorName === 'SequelizeValidationError' ||
      errorName === 'ValidationError' ||
      error.errors?.length > 0
    ) {
      const details = error.errors?.map((e: any) => ({
        field: e.path,
        message: e.message,
        type: e.type,
      }));
      return new ValidationError(message, details);
    }

    // Sequelize Unique Constraint Errors
    if (
      errorName === 'SequelizeUniqueConstraintError' ||
      message.includes('unique constraint')
    ) {
      return new ConflictError(message);
    }

    // Sequelize Foreign Key Errors
    if (
      errorName === 'SequelizeForeignKeyConstraintError' ||
      message.includes('foreign key constraint')
    ) {
      return new ValidationError('Invalid reference: ' + message);
    }

    // Sequelize Database Errors
    if (errorName === 'SequelizeDatabaseError') {
      return new AppError(message, 500, 'DATABASE_ERROR');
    }

    // Default to validation error for database issues
    if (message.includes('cannot be null') || message.includes('required')) {
      return new ValidationError(message);
    }

    return new AppError(message, 500, 'DATABASE_ERROR');
  }
}
