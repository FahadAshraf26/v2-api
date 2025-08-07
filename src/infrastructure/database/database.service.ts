import { Sequelize } from 'sequelize';
import { inject, injectable } from 'tsyringe';
import { Result, Ok, Err } from 'oxide.ts';
import { config } from '@/config/app';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { initializeModels } from '@/infrastructure/database/models';

@injectable()
export class DatabaseService {
  private sequelize: Sequelize | null = null;

  constructor(@inject(LoggerService) private readonly logger: LoggerService) {}

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
        logging:
          config.NODE_ENV === 'development'
            ? msg => this.logger.debug('Sequelize', { query: msg })
            : false,
        dialectOptions: {
          charset: 'utf8mb4',
        },
        define: {
          timestamps: true,
          underscored: true,
          paranoid: true,
        },
      });

      await this.sequelize.authenticate();

      initializeModels(this.sequelize);

      // if (config.NODE_ENV === 'development') {
      //   await this.sequelize.sync({ alter: true });
      //   this.logger.info('Database synced');
      // }

      return Ok(undefined);
    } catch (error) {
      this.logger.error('Database connection failed', error as Error);
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
