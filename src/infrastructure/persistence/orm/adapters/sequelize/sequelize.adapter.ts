import { injectable, inject } from 'tsyringe';
import { Sequelize, Model, ModelStatic } from 'sequelize';
import { DatabaseService } from '@/infrastructure/database/database.service';
import { IORMAdapter } from '../../orm-adapter.interface';
import { IQueryBuilder } from '@/infrastructure/persistence/query-builder/query-builder.interface';
import { SequelizeQueryBuilderImpl } from './sequelize-query-builder.impl';

@injectable()
export class SequelizeAdapter implements IORMAdapter {
  private sequelize: Sequelize;
  private models: Map<string, ModelStatic<Model>> = new Map();

  constructor(@inject(DatabaseService) private database: DatabaseService) {
    this.sequelize = database.getSequelize();
  }

  createQueryBuilder<T>(modelName: string): IQueryBuilder<T> {
    const model = this.getModel(modelName);
    return new SequelizeQueryBuilderImpl<T>(model);
  }

  async create<T>(
    modelName: string,
    data: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<T> {
    const model = this.getModel(modelName);
    const instance = (await model.create(data, options)) as Model;
    return instance.get({ plain: true }) as T;
  }

  async bulkCreate<T>(
    modelName: string,
    data: any[],
    options?: any
  ): Promise<T[]> {
    const model = this.getModel(modelName);
    const instances = await model.bulkCreate(data, {
      ...options,
      returning: true,
    });
    return instances.map(i => i.get({ plain: true })) as T[];
  }

  async update<T>(
    modelName: string,
    data: Record<string, unknown>,
    where: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<[number, T[]]> {
    const model = this.getModel(modelName);
    const updateOptions = { where, returning: true, ...(options || {}) };
    const result = (await model.update(data, updateOptions)) as unknown as [
      number,
      Model[],
    ];

    if (result[1]) {
      return [
        result[0],
        result[1].map((i: Model) => i.get({ plain: true })) as T[],
      ];
    }

    return [result[0], []];
  }

  async delete(modelName: string, where: any, options?: any): Promise<number> {
    const model = this.getModel(modelName);
    return await model.destroy({ where, ...options });
  }

  async findByPk<T>(
    modelName: string,
    id: string,
    options?: any
  ): Promise<T | null> {
    const model = this.getModel(modelName);
    const instance = await model.findByPk(id, options);
    return instance ? (instance.get({ plain: true }) as T) : null;
  }

  async transaction<T>(callback: (transaction: any) => Promise<T>): Promise<T> {
    return await this.sequelize.transaction(callback);
  }

  getModel(modelName: string): ModelStatic<Model> {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }
    return model;
  }

  registerModel(modelName: string, model: ModelStatic<Model>): void {
    this.models.set(modelName, model);
  }
}
