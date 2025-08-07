import { Sequelize } from 'sequelize';
import { injectable } from 'tsyringe';
import { Result, Ok, Err } from 'oxide.ts';

import { config } from '@/config/app';
import { initializeModels } from '@/infrastructure/database/models';

@injectable()
export class DatabaseService {
  private sequelize: Sequelize | null = null;

  async connect(): Promise<Result<void, Error>> {
    try {
      this.sequelize = new Sequelize({
        dialect: 'mysql',
        host: config.DB_HOST,
        port: config.DB_PORT,
        database: config.DB_NAME,
        username: config.DB_USER,
        password: config.DB_PASSWORD,
        pool: {
          max: config.DB_POOL_MAX,
          min: config.DB_POOL_MIN,
          acquire: config.DB_POOL_ACQUIRE,
          idle: config.DB_POOL_IDLE,
        },
        logging: config.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci',
        },
        define: {
          timestamps: true,
          underscored: true,
          paranoid: true, // Soft deletes
        },
      });

      await this.sequelize.authenticate();

      // Initialize models
      initializeModels(this.sequelize);

      // Sync database (only in development)
      if (config.NODE_ENV === 'development') {
        await this.sequelize.sync({ alter: true });
      }

      return Ok(undefined);
    } catch (error) {
      return Err(error as Error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.sequelize) {
      await this.sequelize.close();
      this.sequelize = null;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.sequelize) return false;
      await this.sequelize.authenticate();
      return true;
    } catch {
      return false;
    }
  }

  getSequelize(): Sequelize {
    if (!this.sequelize) {
      throw new Error('Database not connected');
    }
    return this.sequelize;
  }
}
