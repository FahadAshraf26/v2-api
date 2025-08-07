import {
  Model,
  DataTypes,
  Sequelize,
  ModelAttributes,
  ModelOptions,
  ModelStatic,
} from 'sequelize';

export { DataTypes };

export class BaseORMModel<T extends {} = any> extends Model<T> {
  static initializeModel<M extends Model>(
    this: ModelStatic<M>,
    sequelize: Sequelize,
    modelName: string,
    attributes: ModelAttributes,
    options?: ModelOptions
  ): void {
    this.init(attributes, {
      sequelize,
      modelName,
      ...options,
    });
  }
}
