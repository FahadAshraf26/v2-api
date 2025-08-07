export interface IQueryBuilder<T> {
  select(fields: string[]): IQueryBuilder<T>;
  where(conditions: Record<string, any>): IQueryBuilder<T>;
  whereIn(field: string, values: any[]): IQueryBuilder<T>;
  whereBetween(field: string, start: any, end: any): IQueryBuilder<T>;
  whereNull(field: string): IQueryBuilder<T>;
  whereNotNull(field: string): IQueryBuilder<T>;
  orderBy(field: string, direction: 'ASC' | 'DESC'): IQueryBuilder<T>;
  limit(count: number): IQueryBuilder<T>;
  offset(count: number): IQueryBuilder<T>;
  include(relation: string, fields?: string[]): IQueryBuilder<T>;
  execute(): Promise<T[]>;
  first(): Promise<T | null>;
  count(): Promise<number>;
}
