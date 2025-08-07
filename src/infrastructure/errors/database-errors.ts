export class DatabaseConnectionError extends Error {
  constructor(message: string) {
    super(`Database connection failed: ${message}`);
  }
}

export class DatabaseQueryError extends Error {
  constructor(query: string, error: string) {
    super(`Database query failed: ${error}`);
  }
}

export class UniqueConstraintViolationError extends Error {
  constructor(field: string) {
    super(`Unique constraint violation on field: ${field}`);
  }
}

export class ForeignKeyViolationError extends Error {
  constructor(relation: string) {
    super(`Foreign key constraint violation: ${relation}`);
  }
}
