export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export abstract class ValidationError extends DomainError {
  readonly statusCode = 400;
  details: any;
}

export abstract class NotFoundError extends DomainError {
  readonly statusCode = 404;
}

export abstract class ConflictError extends DomainError {
  readonly statusCode = 409;
}

export abstract class UnauthorizedError extends DomainError {
  readonly statusCode = 401;
}

export abstract class BusinessRuleViolationError extends DomainError {
  readonly statusCode = 422;
}
