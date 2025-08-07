import { IQueryBuilder } from '../query-builder/query-builder.interface';

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
  delete(modelName: string, where: any, options?: any): Promise<number>;
  findByPk<T>(modelName: string, id: string, options?: any): Promise<T | null>;
  transaction<T>(callback: (transaction: any) => Promise<T>): Promise<T>;
  getModel(modelName: string): any;
}

export interface ITransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
