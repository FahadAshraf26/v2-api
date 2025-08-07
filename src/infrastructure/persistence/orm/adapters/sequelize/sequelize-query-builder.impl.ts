import {
  Model,
  ModelStatic,
  FindOptions,
  Op,
  WhereOptions,
  Order,
  Includeable,
  QueryTypes,
} from 'sequelize';
import { IQueryBuilder } from '@/infrastructure/persistence/query-builder/query-builder.interface';

type FlexibleWhereOptions = WhereOptions & Record<string, unknown>;

interface ILogger {
  warn(message: string): void;
}

export class SequelizeQueryBuilderImpl<T> implements IQueryBuilder<T> {
  private model: ModelStatic<Model>;
  private options: FindOptions<T> = {};
  private whereConditions: FlexibleWhereOptions = {};
  private orConditions: FlexibleWhereOptions[] = [];
  private includeRelations: Includeable[] = [];
  private logger: ILogger;

  constructor(model: ModelStatic<Model>, logger?: ILogger) {
    this.model = model;
    this.logger = logger || {
      warn: (message: string) => console.warn(message),
    };
  }

  select(fields: string[]): IQueryBuilder<T> {
    this.options.attributes = fields;
    return this;
  }

  where(conditions: Record<string, unknown>): IQueryBuilder<T> {
    this.whereConditions = {
      ...this.whereConditions,
      ...this.mapConditions(conditions),
    };
    return this;
  }

  whereIn(field: string, values: unknown[]): IQueryBuilder<T> {
    this.whereConditions[field] = { [Op.in]: values };
    return this;
  }

  whereNotIn(field: string, values: any[]): IQueryBuilder<T> {
    this.whereConditions[field] = { [Op.notIn]: values };
    return this;
  }

  whereBetween(field: string, start: any, end: any): IQueryBuilder<T> {
    this.whereConditions[field] = { [Op.between]: [start, end] };
    return this;
  }

  whereNotBetween(field: string, start: any, end: any): IQueryBuilder<T> {
    this.whereConditions[field] = { [Op.notBetween]: [start, end] };
    return this;
  }

  whereNull(field: string): IQueryBuilder<T> {
    this.whereConditions[field] = { [Op.is]: null };
    return this;
  }

  whereNotNull(field: string): IQueryBuilder<T> {
    this.whereConditions[field] = { [Op.not]: null };
    return this;
  }

  whereLike(field: string, pattern: string): IQueryBuilder<T> {
    this.whereConditions[field] = { [Op.like]: pattern };
    return this;
  }

  whereNotLike(field: string, pattern: string): IQueryBuilder<T> {
    this.whereConditions[field] = { [Op.notLike]: pattern };
    return this;
  }

  whereGt(field: string, value: any): IQueryBuilder<T> {
    this.whereConditions[field] = { [Op.gt]: value };
    return this;
  }

  whereGte(field: string, value: any): IQueryBuilder<T> {
    this.whereConditions[field] = { [Op.gte]: value };
    return this;
  }

  whereLt(field: string, value: any): IQueryBuilder<T> {
    this.whereConditions[field] = { [Op.lt]: value };
    return this;
  }

  whereLte(field: string, value: any): IQueryBuilder<T> {
    this.whereConditions[field] = { [Op.lte]: value };
    return this;
  }

  whereNot(conditions: Record<string, any>): IQueryBuilder<T> {
    const mappedConditions = this.mapConditions(conditions);
    for (const [key, value] of Object.entries(mappedConditions)) {
      this.whereConditions[key] = { [Op.ne]: value };
    }
    return this;
  }

  orWhere(conditions: Record<string, unknown>): IQueryBuilder<T> {
    this.orConditions.push(
      this.mapConditions(conditions) as FlexibleWhereOptions
    );
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): IQueryBuilder<T> {
    if (!this.options.order) {
      this.options.order = [];
    }
    (this.options.order as any[]).push([field, direction]);
    return this;
  }

  groupBy(fields: string[]): IQueryBuilder<T> {
    this.options.group = fields;
    return this;
  }

  having(conditions: Record<string, any>): IQueryBuilder<T> {
    this.options.having = this.mapConditions(conditions);
    return this;
  }

  limit(count: number): IQueryBuilder<T> {
    this.options.limit = count;
    return this;
  }

  offset(count: number): IQueryBuilder<T> {
    this.options.offset = count;
    return this;
  }

  include(relation: string, fields?: string[]): IQueryBuilder<T> {
    const include: Includeable = {
      association: relation,
      ...(fields && { attributes: fields }),
    };
    this.includeRelations.push(include);
    return this;
  }

  includeNested(
    relations: Array<{ association: string; include?: any[] }>
  ): IQueryBuilder<T> {
    this.includeRelations.push(...relations);
    return this;
  }

  distinct(field?: string): IQueryBuilder<T> {
    // Note: distinct and col are not standard FindOptions properties
    // Using attributes with DISTINCT function instead
    if (field && this.model.sequelize) {
      const fn = this.model.sequelize.fn(
        'DISTINCT',
        this.model.sequelize.col(field)
      );
      this.options.attributes = [[fn, field]];
    }
    return this;
  }

  raw(): IQueryBuilder<T> {
    (this.options as any).raw = true;
    return this;
  }

  nest(): IQueryBuilder<T> {
    (this.options as any).nest = true;
    return this;
  }

  async execute(): Promise<T[]> {
    this.buildWhereClause();

    if (this.includeRelations.length > 0) {
      this.options.include = this.includeRelations;
    }

    const results = await this.model.findAll(this.options);

    if (this.options.raw) {
      return results as unknown as T[];
    }

    return results.map(r => r.get({ plain: true })) as T[];
  }

  async first(): Promise<T | null> {
    this.buildWhereClause();

    if (this.includeRelations.length > 0) {
      this.options.include = this.includeRelations;
    }

    const result = await this.model.findOne(this.options);

    if (!result) {
      return null;
    }

    if (this.options.raw) {
      return result as unknown as T;
    }

    return result.get({ plain: true }) as T;
  }

  async count(): Promise<number> {
    this.buildWhereClause();

    const countOptions: any = {
      where: this.options.where,
    };

    if (this.includeRelations.length > 0) {
      countOptions.include = this.includeRelations;
    }

    const result = await this.model.count(countOptions);
    return typeof result === 'number' ? result : result.length;
  }

  async sum(field: string): Promise<number> {
    this.buildWhereClause();

    if (!this.options.where) {
      const result = await this.model.sum(field);
      return result || 0;
    }

    const result = await this.model.sum(field, {
      where: this.options.where,
    });

    return result || 0;
  }

  async avg(field: string): Promise<number> {
    this.buildWhereClause();

    if (!this.options.where) {
      const result = await this.model.aggregate(field, 'AVG');
      return Number(result) || 0;
    }

    const result = await this.model.aggregate(field, 'AVG', {
      where: this.options.where,
    });

    return Number(result) || 0;
  }

  async min(field: string): Promise<any> {
    this.buildWhereClause();

    if (!this.options.where) {
      return await this.model.min(field);
    }

    return await this.model.min(field, {
      where: this.options.where,
    });
  }

  async max(field: string): Promise<any> {
    this.buildWhereClause();

    if (!this.options.where) {
      return await this.model.max(field);
    }

    return await this.model.max(field, {
      where: this.options.where,
    });
  }

  async exists(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }

  async paginate(
    page: number,
    pageSize: number
  ): Promise<{ items: T[]; total: number; totalPages: number }> {
    const total = await this.count();
    const totalPages = Math.ceil(total / pageSize);

    this.limit(pageSize);
    this.offset((page - 1) * pageSize);

    const items = await this.execute();

    return {
      items,
      total,
      totalPages,
    };
  }

  private buildWhereClause(): void {
    if (
      Object.keys(this.whereConditions).length === 0 &&
      this.orConditions.length === 0
    ) {
      return;
    }

    if (this.orConditions.length > 0) {
      const allConditions = [this.whereConditions, ...this.orConditions].filter(
        cond => Object.keys(cond).length > 0
      );

      if (allConditions.length > 0) {
        this.options.where = { [Op.or]: allConditions };
      }
    } else {
      this.options.where = this.whereConditions;
    }
  }

  private mapConditions(
    conditions: Record<string, unknown>
  ): FlexibleWhereOptions {
    const mapped: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(conditions)) {
      if (value === null) {
        mapped[key] = { [Op.is]: null };
      } else if (value === undefined) {
        continue;
      } else if (Array.isArray(value)) {
        mapped[key] = { [Op.in]: value };
      } else if (typeof value === 'object' && value?.constructor === Object) {
        // Handle nested operators like { gt: 10, lt: 20 }
        const nestedConditions: Record<string | symbol, unknown> = {};
        for (const [opKey, opValue] of Object.entries(value)) {
          const operator = this.mapOperatorKey(opKey);
          if (operator) {
            nestedConditions[operator] = opValue;
          } else {
            nestedConditions[opKey] = opValue;
          }
        }
        mapped[key] = nestedConditions;
      } else {
        mapped[key] = value;
      }
    }

    return mapped as FlexibleWhereOptions;
  }

  private mapOperatorKey(key: string): symbol | null {
    const operatorMap: Record<string, symbol> = {
      eq: Op.eq,
      ne: Op.ne,
      is: Op.is,
      not: Op.not,
      or: Op.or,
      gt: Op.gt,
      gte: Op.gte,
      lt: Op.lt,
      lte: Op.lte,
      between: Op.between,
      notBetween: Op.notBetween,
      in: Op.in,
      notIn: Op.notIn,
      like: Op.like,
      notLike: Op.notLike,
      iLike: Op.iLike,
      notILike: Op.notILike,
      regexp: Op.regexp,
      notRegexp: Op.notRegexp,
      iRegexp: Op.iRegexp,
      notIRegexp: Op.notIRegexp,
    };

    return operatorMap[key] || null;
  }

  // Join methods (for complex queries)
  join(table: string, condition: string): IQueryBuilder<T> {
    // Sequelize handles joins through associations/includes
    // This would need custom implementation based on your needs
    this.logger.warn(
      'Join operations should use include() with associations in Sequelize'
    );
    return this;
  }

  leftJoin(table: string, condition: string): IQueryBuilder<T> {
    // Similar to join
    this.logger.warn(
      'Left join operations should use include() with required: false in Sequelize'
    );
    return this;
  }

  // Remove duplicate raw function - keeping only the query version
  async rawQuery(query: string, replacements?: unknown[]): Promise<any> {
    const sequelize = this.model.sequelize;
    if (!sequelize) {
      throw new Error('Sequelize instance not available');
    }

    const options: any = {
      type: QueryTypes.SELECT,
    };

    if (replacements) {
      options.replacements = replacements;
    }

    const results = await sequelize.query(query, options);
    return results;
  }
}
