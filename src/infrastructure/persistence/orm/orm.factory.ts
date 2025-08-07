import { container } from 'tsyringe';
import { IORMAdapter } from './orm-adapter.interface';
import { config } from '@/config/app';

export class ORMFactory {
  static async create(): Promise<IORMAdapter> {
    const ormType = config.ORM_TYPE || 'sequelize';

    switch (ormType) {
      case 'sequelize': {
        const { SequelizeAdapter } = await import(
          './adapters/sequelize/sequelize.adapter'
        );
        return container.resolve(SequelizeAdapter);
      }

      default:
        throw new Error(`Unsupported ORM type: ${ormType}`);
    }
  }
}
