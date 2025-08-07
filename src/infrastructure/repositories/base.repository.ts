import { inject, injectable } from 'tsyringe';
import { Result, Ok, Err } from 'oxide.ts';
import {
  IBaseRepository,
  IPaginatedRepository,
  FindOneCriteria,
  FindManyCriteria,
  CountCriteria,
  PaginatedResult,
} from '@/domain/core/repository.interface';
import { Entity } from '@/domain/core/entity';
import { AggregateRoot } from '@/domain/core/aggregate-root';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';
import type { IQueryBuilder } from '@/infrastructure/persistence/query-builder/query-builder.interface';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { EventBus } from '@/infrastructure/events/event-bus';
import { TOKENS } from '@/config/dependency-injection';
import type { DomainEvent } from '@/domain/core/domain-event';
import type { WhereCondition } from '@/domain/core/repository.interface';

export abstract class BaseRepository<TDomain extends Entity<any>, TModel>
  implements IPaginatedRepository<TDomain>
{
  protected modelName: string;
  protected ormAdapter: IORMAdapter;
  protected logger: LoggerService;
  protected eventBus: EventBus;

  constructor(
    modelName: string,
    @inject(TOKENS.ORMAdapterToken) ormAdapter: IORMAdapter,
    @inject(LoggerService) logger: LoggerService,
    @inject(EventBus) eventBus: EventBus
  ) {
    this.modelName = modelName;
    this.ormAdapter = ormAdapter;
    this.logger = logger.child({
      repository: this.constructor.name,
      model: modelName,
    });
    this.eventBus = eventBus;
  }

  /**
   * Abstract methods that must be implemented by concrete repositories
   */
  protected abstract toDomain(model: TModel): TDomain;
  protected abstract toPersistence(domain: TDomain): any;
  protected abstract getEntityName(): string;

  /**
   * Create a new query builder instance
   */
  protected createQueryBuilder(): IQueryBuilder<TModel> {
    return this.ormAdapter.createQueryBuilder<TModel>(this.modelName);
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<Result<TDomain | null, Error>> {
    try {
      this.logger.debug(`Finding ${this.getEntityName()} by id`, { id });

      const model = await this.ormAdapter.findByPk<TModel>(this.modelName, id);

      if (!model) {
        this.logger.debug(`${this.getEntityName()} not found`, { id });
        return Ok(null);
      }

      const domain = this.toDomain(model);
      this.logger.debug(`${this.getEntityName()} found`, { id });

      return Ok(domain);
    } catch (error) {
      this.logger.error(
        `Error finding ${this.getEntityName()} by id`,
        error as Error
      );
      return Err(
        this.createError(`Failed to find ${this.getEntityName()}`, error)
      );
    }
  }

  /**
   * Find one entity by criteria
   */
  async findOne(
    criteria: FindOneCriteria<TDomain>
  ): Promise<Result<TDomain | null, Error>> {
    try {
      this.logger.debug(`Finding one ${this.getEntityName()}`, { criteria });

      const queryBuilder = this.createQueryBuilder();

      if (criteria.where) {
        const persistenceCriteria = this.mapDomainCriteriaToPersistence(
          criteria.where
        );
        queryBuilder.where(persistenceCriteria);
      }

      if (criteria.include) {
        criteria.include.forEach(relation => {
          if (typeof relation === 'string') {
            queryBuilder.include(relation);
          } else {
            // Handle IncludeOption type - for now just use the relation name
            queryBuilder.include(relation.relation);
          }
        });
      }

      const result = await queryBuilder.first();

      if (!result) {
        this.logger.debug(`${this.getEntityName()} not found with criteria`, {
          criteria,
        });
        return Ok(null);
      }

      const domain = this.toDomain(result);
      return Ok(domain);
    } catch (error) {
      this.logger.error(
        `Error finding ${this.getEntityName()}`,
        error as Error
      );
      return Err(
        this.createError(`Failed to find ${this.getEntityName()}`, error)
      );
    }
  }

  /**
   * Find many entities with advanced query options
   */
  async findMany(
    criteria: FindManyCriteria<TDomain> = {}
  ): Promise<Result<TDomain[], Error>> {
    try {
      this.logger.debug(`Finding multiple ${this.getEntityName()}s`, {
        criteria,
      });

      const queryBuilder = this.createQueryBuilder();

      if (criteria.where) {
        const persistenceCriteria = this.mapDomainCriteriaToPersistence(
          criteria.where
        );
        queryBuilder.where(persistenceCriteria);
      }

      if (criteria.orderBy) {
        criteria.orderBy.forEach(order => {
          queryBuilder.orderBy(order.field, order.direction);
        });
      }

      if (criteria.limit !== undefined) {
        queryBuilder.limit(criteria.limit);
      }

      if (criteria.offset !== undefined) {
        queryBuilder.offset(criteria.offset);
      }

      if (criteria.include) {
        criteria.include.forEach(relation => {
          if (typeof relation === 'string') {
            queryBuilder.include(relation);
          } else {
            // Handle IncludeOption type - for now just use the relation name
            queryBuilder.include(relation.relation);
          }
        });
      }

      const results = await queryBuilder.execute();
      const domains = results.map(model => this.toDomain(model));

      this.logger.debug(`Found ${domains.length} ${this.getEntityName()}s`);

      return Ok(domains);
    } catch (error) {
      this.logger.error(
        `Error finding multiple ${this.getEntityName()}s`,
        error as Error
      );
      return Err(
        this.createError(`Failed to find ${this.getEntityName()}s`, error)
      );
    }
  }

  /**
   * Find with pagination
   */
  async findPaginated(
    criteria: FindManyCriteria<TDomain> & { page: number; pageSize: number }
  ): Promise<Result<PaginatedResult<TDomain>, Error>> {
    try {
      const { page, pageSize, ...findCriteria } = criteria;

      this.logger.debug(`Finding paginated ${this.getEntityName()}s`, {
        page,
        pageSize,
        criteria: findCriteria,
      });

      // Validate pagination parameters
      if (page < 1) {
        return Err(new Error('Page must be greater than 0'));
      }

      if (pageSize < 1 || pageSize > 1000) {
        return Err(new Error('Page size must be between 1 and 1000'));
      }

      // Get total count
      const countCriteria: CountCriteria<TDomain> = {};
      if (findCriteria.where) {
        countCriteria.where = findCriteria.where;
      }
      const countResult = await this.count(countCriteria);
      if (countResult.isErr()) {
        return Err(countResult.unwrapErr());
      }
      const total = countResult.unwrap();

      // Calculate pagination
      const totalPages = Math.ceil(total / pageSize);
      const offset = (page - 1) * pageSize;

      // Get paginated items
      const itemsResult = await this.findMany({
        ...findCriteria,
        limit: pageSize,
        offset,
      });

      if (itemsResult.isErr()) {
        return Err(itemsResult.unwrapErr());
      }

      const result: PaginatedResult<TDomain> = {
        items: itemsResult.unwrap(),
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      };

      this.logger.debug(`Paginated results`, {
        total,
        page,
        totalPages,
        itemCount: result.items.length,
      });

      return Ok(result);
    } catch (error) {
      this.logger.error('Error in paginated find', error as Error);
      return Err(this.createError('Pagination failed', error));
    }
  }

  /**
   * Count entities
   */
  async count(
    criteria: CountCriteria<TDomain> = {}
  ): Promise<Result<number, Error>> {
    try {
      const queryBuilder = this.createQueryBuilder();

      if (criteria.where) {
        const persistenceCriteria = this.mapDomainCriteriaToPersistence(
          criteria.where
        );
        queryBuilder.where(persistenceCriteria);
      }

      const count = await queryBuilder.count();

      this.logger.debug(`Counted ${count} ${this.getEntityName()}s`);

      return Ok(count);
    } catch (error) {
      this.logger.error('Error counting entities', error as Error);
      return Err(this.createError('Count failed', error));
    }
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<Result<boolean, Error>> {
    try {
      const queryBuilder = this.createQueryBuilder();
      const count = await queryBuilder.where({ id } as any).count();

      return Ok(count > 0);
    } catch (error) {
      this.logger.error('Error checking existence', error as Error);
      return Err(this.createError('Existence check failed', error));
    }
  }

  /**
   * Save new entity
   */
  async save(
    entity: TDomain,
    options?: { transaction?: any }
  ): Promise<Result<TDomain, Error>> {
    try {
      this.logger.debug(`Saving new ${this.getEntityName()}`, {
        id: entity.id,
      });

      const data = this.toPersistence(entity);

      const model = await this.ormAdapter.create<TModel>(
        this.modelName,
        data,
        options
      );

      const savedDomain = this.toDomain(model);

      // Publish domain events if entity is an aggregate root
      await this.publishEvents(entity);

      this.logger.info(`${this.getEntityName()} saved successfully`, {
        id: savedDomain.id,
      });

      return Ok(savedDomain);
    } catch (error) {
      this.logger.error(`Error saving ${this.getEntityName()}`, error as Error);
      return Err(
        this.createError(`Failed to save ${this.getEntityName()}`, error)
      );
    }
  }

  /**
   * Save multiple entities (batch insert)
   */
  async saveMany(
    entities: TDomain[],
    options?: { transaction?: any }
  ): Promise<Result<TDomain[], Error>> {
    try {
      this.logger.debug(`Saving ${entities.length} ${this.getEntityName()}s`);

      const data = entities.map(entity => this.toPersistence(entity));

      const models = await this.ormAdapter.bulkCreate<TModel>(
        this.modelName,
        data,
        options
      );

      const savedDomains = models.map(model => this.toDomain(model));

      // Publish domain events for all entities
      await Promise.all(entities.map(entity => this.publishEvents(entity)));

      this.logger.info(
        `${entities.length} ${this.getEntityName()}s saved successfully`
      );

      return Ok(savedDomains);
    } catch (error) {
      this.logger.error('Error in batch save', error as Error);
      return Err(this.createError('Batch save failed', error));
    }
  }

  /**
   * Update entity
   */
  async update(
    id: string,
    updates: Partial<TDomain>,
    options?: { transaction?: any }
  ): Promise<Result<TDomain, Error>> {
    try {
      this.logger.debug(`Updating ${this.getEntityName()}`, { id, updates });

      // Check if entity exists
      const existingResult = await this.findById(id);
      if (existingResult.isErr()) {
        return Err(existingResult.unwrapErr());
      }

      if (!existingResult.unwrap()) {
        return Err(new Error(`${this.getEntityName()} not found`));
      }

      const data = this.mapDomainUpdatesToPersistence(updates);

      const [affectedRows] = await this.ormAdapter.update(
        this.modelName,
        data,
        { id },
        options
      );

      if (affectedRows === 0) {
        return Err(
          new Error(`${this.getEntityName()} not found or no changes made`)
        );
      }

      // Fetch the updated entity
      const updatedResult = await this.findById(id);
      if (updatedResult.isErr()) {
        return Err(updatedResult.unwrapErr());
      }

      const updatedEntity = updatedResult.unwrap();
      if (!updatedEntity) {
        return Err(
          new Error(`Failed to retrieve updated ${this.getEntityName()}`)
        );
      }

      // Publish domain events if there are any
      await this.publishEvents(updatedEntity);

      this.logger.info(`${this.getEntityName()} updated successfully`, { id });

      return Ok(updatedEntity);
    } catch (error) {
      this.logger.error(
        `Error updating ${this.getEntityName()}`,
        error as Error
      );
      return Err(
        this.createError(`Failed to update ${this.getEntityName()}`, error)
      );
    }
  }

  /**
   * Delete entity (soft delete if paranoid is enabled)
   */
  async delete(
    id: string,
    options?: { transaction?: any; force?: boolean }
  ): Promise<Result<void, Error>> {
    try {
      this.logger.debug(`Deleting ${this.getEntityName()}`, {
        id,
        force: options?.force,
      });

      const affectedRows = await this.ormAdapter.delete(
        this.modelName,
        { id },
        options
      );

      if (affectedRows === 0) {
        return Err(new Error(`${this.getEntityName()} not found`));
      }

      this.logger.info(`${this.getEntityName()} deleted successfully`, { id });

      return Ok(undefined);
    } catch (error) {
      this.logger.error(
        `Error deleting ${this.getEntityName()}`,
        error as Error
      );
      return Err(
        this.createError(`Failed to delete ${this.getEntityName()}`, error)
      );
    }
  }

  /**
   * Delete multiple entities
   */
  async deleteMany(
    ids: string[],
    options?: { transaction?: any; force?: boolean }
  ): Promise<Result<void, Error>> {
    try {
      this.logger.debug(`Deleting ${ids.length} ${this.getEntityName()}s`);

      if (ids.length === 0) {
        return Ok(undefined);
      }

      const affectedRows = await this.ormAdapter.delete(
        this.modelName,
        { id: ids },
        options
      );

      this.logger.info(
        `${affectedRows} ${this.getEntityName()}s deleted successfully`
      );

      return Ok(undefined);
    } catch (error) {
      this.logger.error('Error in batch delete', error as Error);
      return Err(this.createError('Batch delete failed', error));
    }
  }

  /**
   * Execute transaction
   */
  async transaction<T>(
    callback: (transaction: any) => Promise<Result<T, Error>>
  ): Promise<Result<T, Error>> {
    try {
      const result = await this.ormAdapter.transaction(async transaction => {
        const callbackResult = await callback(transaction);
        if (callbackResult.isErr()) {
          throw callbackResult.unwrapErr();
        }
        return callbackResult.unwrap();
      });

      return Ok(result);
    } catch (error) {
      this.logger.error('Transaction failed', error as Error);
      return Err(this.createError('Transaction failed', error));
    }
  }

  /**
   * Map domain criteria to persistence format
   * Override this in concrete repositories for complex mappings
   */
  protected mapDomainCriteriaToPersistence(
    criteria: Partial<TDomain> | WhereCondition<TDomain>
  ): Record<string, any> {
    const mapped: Record<string, any> = {};

    for (const [key, value] of Object.entries(criteria)) {
      if (value === undefined) {
        continue;
      }

      // Handle value objects (they usually have a 'value' property)
      if (value && typeof value === 'object' && 'value' in value) {
        mapped[key] = value.value;
      }
      // Handle Date objects
      else if (value instanceof Date) {
        mapped[key] = value.toISOString();
      }
      // Handle arrays
      else if (Array.isArray(value)) {
        mapped[key] = value.map(item =>
          item && typeof item === 'object' && 'value' in item
            ? item.value
            : item
        );
      }
      // Handle nested objects (be careful with this)
      else if (
        value &&
        typeof value === 'object' &&
        value.constructor === Object
      ) {
        mapped[key] = this.mapDomainCriteriaToPersistence(value as any);
      }
      // Primitive values
      else {
        mapped[key] = value;
      }
    }

    return mapped;
  }

  /**
   * Map domain updates to persistence format
   * Can be overridden for different behavior than criteria mapping
   */
  protected mapDomainUpdatesToPersistence(
    updates: Partial<TDomain>
  ): Record<string, any> {
    const mapped = this.mapDomainCriteriaToPersistence(updates);

    // Add updated timestamp if not present
    if (!mapped['updatedAt']) {
      mapped['updatedAt'] = new Date();
    }

    return mapped;
  }

  /**
   * Publish domain events if entity is an aggregate root
   */
  protected async publishEvents(entity: TDomain): Promise<void> {
    if (entity instanceof AggregateRoot) {
      const events = entity.getUncommittedEvents();

      if (events.length > 0) {
        this.logger.debug(`Publishing ${events.length} domain events`);

        await Promise.all(events.map(event => this.eventBus.publish(event)));

        entity.clearEvents();
      }
    }
  }

  /**
   * Create consistent error messages
   */
  protected createError(message: string, originalError?: any): Error {
    const errorMessage = originalError?.message
      ? `${message}: ${originalError.message}`
      : message;

    const error = new Error(errorMessage);

    if (originalError?.stack) {
      error.stack = originalError.stack;
    }

    return error;
  }

  /**
   * Validate entity before save/update
   * Override in concrete repositories for custom validation
   */
  protected async validate(entity: TDomain): Promise<Result<void, Error>> {
    // Default: no validation
    return Ok(undefined);
  }
}
