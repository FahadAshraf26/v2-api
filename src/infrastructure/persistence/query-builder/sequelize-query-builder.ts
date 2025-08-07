import { Model, FindOptions, Op, ModelStatic, CountOptions } from 'sequelize';
import { IQueryBuilder } from './query-builder.interface';

export class SequelizeQueryBuilder<T> implements IQueryBuilder<T> {
  private model: ModelStatic<Model>;
  private options: FindOptions = {};

  constructor(model: ModelStatic<Model>) {
    this.model = model;
  }

  select(fields: string[]): IQueryBuilder<T> {
    this.options.attributes = fields;
    return this;
  }

  where(conditions: Record<string, any>): IQueryBuilder<T> {
    this.options.where = { ...this.options.where, ...conditions };
    return this;
  }

  whereIn(field: string, values: any[]): IQueryBuilder<T> {
    this.options.where = {
      ...this.options.where,
      [field]: { [Op.in]: values },
    };
    return this;
  }

  whereBetween(field: string, start: any, end: any): IQueryBuilder<T> {
    this.options.where = {
      ...this.options.where,
      [field]: { [Op.between]: [start, end] },
    };
    return this;
  }

  whereNull(field: string): IQueryBuilder<T> {
    this.options.where = {
      ...this.options.where,
      [field]: { [Op.is]: null },
    };
    return this;
  }

  whereNotNull(field: string): IQueryBuilder<T> {
    this.options.where = {
      ...this.options.where,
      [field]: { [Op.not]: null },
    };
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC'): IQueryBuilder<T> {
    this.options.order = [[field, direction]];
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
    // Implementation for includes
    return this;
  }

  async execute(): Promise<T[]> {
    const results = await this.model.findAll(this.options);
    return results.map(r => r.get({ plain: true })) as T[];
  }

  async first(): Promise<T | null> {
    const result = await this.model.findOne(this.options);
    return result ? (result.get({ plain: true }) as T) : null;
  }

  async count(): Promise<number> {
    return await this.model.count(this.options);
  }
}
