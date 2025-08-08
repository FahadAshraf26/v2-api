import { injectable, inject } from 'tsyringe';
import { Sequelize, Model, ModelStatic } from 'sequelize';
import { DatabaseService } from '@/infrastructure/database/database.service';
import {
  IORMAdapter,
  ModelSchema,
  AssociationDefinition,
} from '../../orm-adapter.interface';
import { IQueryBuilder } from '@/infrastructure/persistence/query-builder/query-builder.interface';
import { SequelizeQueryBuilderImpl } from './sequelize-query-builder.impl';
import { BaseORMModel } from '../../base-orm-model';
import { TOKENS } from '@/config/dependency-injection';

@injectable()
export class SequelizeAdapter implements IORMAdapter {
  private sequelize: Sequelize | null = null;
  private models: Map<string, ModelStatic<Model>> = new Map();
  private associationDefinitions: Map<
    string,
    Record<string, AssociationDefinition>
  > = new Map();

  constructor(
    @inject(TOKENS.DatabaseServiceToken) private database: DatabaseService
  ) {
    // Don't call getSequelize() in constructor - lazy initialize instead
  }

  private getSequelizeInstance(): Sequelize {
    if (!this.sequelize) {
      this.sequelize = this.database.getSequelize();
    }
    return this.sequelize;
  }

  createQueryBuilder<T>(modelName: string): IQueryBuilder<T> {
    const model = this.getModel(modelName);
    return new SequelizeQueryBuilderImpl<T>(model);
  }

  async create<T>(modelName: string, data: any, options: any = {}): Promise<T> {
    const model = this.getModel(modelName);
    const result = await model.create(data, options);
    return result as unknown as T;
  }

  async bulkCreate<T>(
    modelName: string,
    data: any[],
    options: any = {}
  ): Promise<T[]> {
    const model = this.getModel(modelName);
    const results = await model.bulkCreate(data, options);
    return results as unknown as T[];
  }

  async update<T>(
    modelName: string,
    data: any,
    where: any,
    options: any = {}
  ): Promise<[number, T[]]> {
    const model = this.getModel(modelName);
    const [affectedCount, affectedRows] = await model.update(data, {
      where,
      returning: true,
      ...options,
    });
    return [affectedCount, affectedRows as unknown as T[]];
  }

  async delete(
    modelName: string,
    where: any,
    options: any = {}
  ): Promise<number> {
    const model = this.getModel(modelName);
    return await model.destroy({ where, ...options });
  }

  async findByPk<T>(
    modelName: string,
    id: string,
    options: any = {}
  ): Promise<T | null> {
    const model = this.getModel(modelName);
    const result = await model.findByPk(id, options);
    return result as unknown as T;
  }

  async transaction<T>(callback: (transaction: any) => Promise<T>): Promise<T> {
    const sequelize = this.getSequelizeInstance();
    return await sequelize.transaction(callback);
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

  /**
   * Register a model schema in an ORM-agnostic way
   * This creates a Sequelize model from the schema definition
   */
  registerSchema(schema: ModelSchema): void {
    const sequelize = this.getSequelizeInstance();
    class DynamicModel extends BaseORMModel {}
    DynamicModel.init(schema.attributes, {
      sequelize,
      modelName: schema.name,
      tableName: schema.tableName,
      ...schema.options,
    });
    this.models.set(schema.name, DynamicModel);

    // Store association definitions for later setup
    if (schema.associations) {
      this.associationDefinitions.set(schema.name, schema.associations);
    }
  }

  setupAssociations(): void {
    // Setup all associations after all models are registered
    for (const [
      modelName,
      associations,
    ] of this.associationDefinitions.entries()) {
      const sourceModel = this.models.get(modelName);
      if (!sourceModel) continue;

      for (const [associationName, definition] of Object.entries(
        associations
      )) {
        const targetModel = this.models.get(definition.target);
        if (!targetModel) continue;

        try {
          switch (definition.type) {
            case 'hasOne':
              sourceModel.hasOne(targetModel, definition.options);
              break;
            case 'hasMany':
              sourceModel.hasMany(targetModel, definition.options);
              break;
            case 'belongsTo':
              sourceModel.belongsTo(targetModel, definition.options);
              break;
            case 'belongsToMany':
              // Only setup belongsToMany if through is specified
              if (definition.options.through) {
                sourceModel.belongsToMany(
                  targetModel,
                  definition.options as any
                );
              }
              break;
          }
        } catch (error) {
          console.warn(
            `Failed to setup association ${modelName}.${associationName}:`,
            error
          );
        }
      }
    }
  }
}
