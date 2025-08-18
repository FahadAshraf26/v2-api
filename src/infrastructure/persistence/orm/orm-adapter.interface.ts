import { IQueryBuilder } from '@/infrastructure/persistence/query-builder/query-builder.interface';

export interface AssociationDefinition {
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany';
  target: string;
  options: {
    foreignKey?: string;
    sourceKey?: string;
    targetKey?: string;
    as?: string;
    through?: string;
    [key: string]: any;
  };
}

export interface ModelSchema {
  name: string;
  tableName: string;
  attributes: Record<string, any>;
  options?: Record<string, any>;
  associations?: Record<string, AssociationDefinition>;
}

export interface IORMAdapter {
  createQueryBuilder<T>(modelName: string): IQueryBuilder<T>;
  create<T>(modelName: string, data: any, options?: any): Promise<T>;
  bulkCreate<T>(modelName: string, data: any[], options?: any): Promise<T[]>;
  update<T>(
    modelName: string,
    data: any,
    where: any,
    options?: any
  ): Promise<[number, T[]]>;
  delete(
    modelName: string,
    criteria: Record<string, any>,
    options?: { transaction?: any; force?: boolean }
  ): Promise<number>;
  findByPk<T>(modelName: string, id: string, options?: any): Promise<T | null>;
  transaction<T>(callback: (transaction: any) => Promise<T>): Promise<T>;
  getModel(modelName: string): any;
  registerSchema(schema: ModelSchema): void;
  rawQuery(query: string, replacements?: unknown[]): Promise<any[]>;
}

export interface ITransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
