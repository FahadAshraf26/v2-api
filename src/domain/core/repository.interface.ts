// src/domain/core/repository.interface.ts
import { Result } from 'oxide.ts';

/**
 * Base criteria for finding entities
 */
export interface BaseCriteria<T> {
  where?: Partial<T> | WhereCondition<T>;
}

/**
 * Criteria for finding a single entity
 */
export interface FindOneCriteria<T> extends BaseCriteria<T> {
  include?: string[] | IncludeOption[];
  attributes?: string[];
}

/**
 * Criteria for finding multiple entities
 */
export interface FindManyCriteria<T> extends BaseCriteria<T> {
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
  include?: string[] | IncludeOption[];
  attributes?: string[];
  distinct?: boolean;
  groupBy?: string[];
}

/**
 * Criteria for counting entities
 */
export interface CountCriteria<T> extends BaseCriteria<T> {
  distinct?: boolean;
  include?: string[] | IncludeOption[];
}

/**
 * Query criteria (keeping for backward compatibility, but prefer FindManyCriteria)
 */
export interface QueryCriteria<T> extends FindManyCriteria<T> {
  // Alias for FindManyCriteria for backward compatibility
}

/**
 * Advanced where conditions with operators
 */
export type WhereCondition<T> = {
  [K in keyof Partial<T>]?: T[K] | WhereOperators<T[K]> | null;
};

/**
 * Query operators for where conditions
 */
export interface WhereOperators<T> {
  eq?: T; // equals
  ne?: T; // not equals
  gt?: T; // greater than
  gte?: T; // greater than or equal
  lt?: T; // less than
  lte?: T; // less than or equal
  between?: [T, T]; // between two values
  notBetween?: [T, T]; // not between two values
  in?: T[]; // in array
  notIn?: T[]; // not in array
  like?: string; // SQL LIKE
  notLike?: string; // SQL NOT LIKE
  is?: null | boolean; // IS NULL or IS TRUE/FALSE
  not?: null | boolean | T; // IS NOT
}

/**
 * Order by option
 */
export interface OrderBy {
  field: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Include option for relations
 */
export interface IncludeOption {
  relation: string;
  attributes?: string[];
  where?: Record<string, any>;
  required?: boolean;
  include?: IncludeOption[];
}

/**
 * Paginated result with additional metadata
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  isolationLevel?:
    | 'READ_UNCOMMITTED'
    | 'READ_COMMITTED'
    | 'REPEATABLE_READ'
    | 'SERIALIZABLE';
  autocommit?: boolean;
}

/**
 * Save options
 */
export interface SaveOptions {
  transaction?: any;
  validate?: boolean;
  hooks?: boolean;
}

/**
 * Update options
 */
export interface UpdateOptions extends SaveOptions {
  fields?: string[];
  returning?: boolean;
}

/**
 * Delete options
 */
export interface DeleteOptions {
  transaction?: any;
  force?: boolean; // Hard delete even if soft delete is enabled
  cascade?: boolean;
}

/**
 * Bulk operation options
 */
export interface BulkOptions extends SaveOptions {
  updateOnDuplicate?: string[];
  ignoreDuplicates?: boolean;
}

/**
 * Base repository interface - Lives in DOMAIN layer
 * This is a PORT in hexagonal architecture
 */
export interface IBaseRepository<T> {
  // Find operations with enhanced criteria
  findById(
    id: string,
    options?: FindOneCriteria<T>
  ): Promise<Result<T | null, Error>>;
  findOne(
    criteria: FindOneCriteria<T> | Partial<T>
  ): Promise<Result<T | null, Error>>;
  findMany(
    criteria?: FindManyCriteria<T> | QueryCriteria<T>
  ): Promise<Result<T[], Error>>;

  // Count and existence checks
  count(
    criteria?: CountCriteria<T> | Partial<T>
  ): Promise<Result<number, Error>>;
  exists(id: string): Promise<Result<boolean, Error>>;
  existsWhere?(criteria: CountCriteria<T>): Promise<Result<boolean, Error>>;

  // Save operations with options
  save(entity: T, options?: SaveOptions): Promise<Result<T, Error>>;
  saveMany(entities: T[], options?: BulkOptions): Promise<Result<T[], Error>>;

  // Update operations with options
  update(
    id: string,
    entity: Partial<T>,
    options?: UpdateOptions
  ): Promise<Result<T, Error>>;
  updateMany?(
    criteria: BaseCriteria<T>,
    updates: Partial<T>,
    options?: UpdateOptions
  ): Promise<Result<number, Error>>;

  // Delete operations with options
  delete(id: string, options?: DeleteOptions): Promise<Result<void, Error>>;
  deleteMany(
    ids: string[],
    options?: DeleteOptions
  ): Promise<Result<void, Error>>;
  deleteWhere?(
    criteria: BaseCriteria<T>,
    options?: DeleteOptions
  ): Promise<Result<number, Error>>;

  // Transaction support
  transaction?<R>(
    callback: (transaction: any) => Promise<Result<R, Error>>,
    options?: TransactionOptions
  ): Promise<Result<R, Error>>;
}

/**
 * Extended repository interface with pagination
 */
export interface IPaginatedRepository<T> extends IBaseRepository<T> {
  findPaginated(
    criteria: (FindManyCriteria<T> | QueryCriteria<T>) & {
      page: number;
      pageSize: number;
    }
  ): Promise<Result<PaginatedResult<T>, Error>>;
}

/**
 * Repository with aggregate operations
 */
export interface IAggregateRepository<T> extends IBaseRepository<T> {
  sum(
    field: keyof T,
    criteria?: CountCriteria<T>
  ): Promise<Result<number, Error>>;
  avg(
    field: keyof T,
    criteria?: CountCriteria<T>
  ): Promise<Result<number, Error>>;
  min(field: keyof T, criteria?: CountCriteria<T>): Promise<Result<any, Error>>;
  max(field: keyof T, criteria?: CountCriteria<T>): Promise<Result<any, Error>>;
  groupBy(
    fields: (keyof T)[],
    criteria?: FindManyCriteria<T>
  ): Promise<Result<Record<string, T[]>, Error>>;
}

/**
 * Repository with soft delete support
 */
export interface ISoftDeleteRepository<T> extends IBaseRepository<T> {
  restore(id: string): Promise<Result<T, Error>>;
  restoreMany(ids: string[]): Promise<Result<number, Error>>;
  findDeleted(criteria?: FindManyCriteria<T>): Promise<Result<T[], Error>>;
  findWithDeleted(criteria?: FindManyCriteria<T>): Promise<Result<T[], Error>>;
  permanentlyDelete(id: string): Promise<Result<void, Error>>;
}

/**
 * Unit of Work interface for transaction management
 */
export interface IUnitOfWork {
  begin(options?: TransactionOptions): Promise<Result<void, Error>>;
  commit(): Promise<Result<void, Error>>;
  rollback(): Promise<Result<void, Error>>;
  getTransaction(): any;
  isTransactionActive(): boolean;
}

/**
 * Batch result for bulk operations
 */
export interface BatchResult<T> {
  successful: T[];
  failed: Array<{ item: T; error: Error }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

/**
 * Type guard to check if repository supports pagination
 */
export function supportsPagination<T>(
  repo: IBaseRepository<T>
): repo is IPaginatedRepository<T> {
  return 'findPaginated' in repo;
}

/**
 * Type guard to check if repository supports soft delete
 */
export function supportsSoftDelete<T>(
  repo: IBaseRepository<T>
): repo is ISoftDeleteRepository<T> {
  return 'restore' in repo && 'findDeleted' in repo;
}

/**
 * Type guard to check if repository supports aggregates
 */
export function supportsAggregates<T>(
  repo: IBaseRepository<T>
): repo is IAggregateRepository<T> {
  return 'sum' in repo && 'avg' in repo;
}
