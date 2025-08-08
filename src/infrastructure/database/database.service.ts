import { Sequelize } from 'sequelize';
import { inject, injectable } from 'tsyringe';
import { Result, Ok, Err } from 'oxide.ts';
import { config } from '@/config/app';
import { LoggerService } from '@/infrastructure/logging/logger.service';

@injectable()
export class DatabaseService {
  private sequelize: Sequelize | null = null;

  constructor(@inject(LoggerService) private readonly logger: LoggerService) {}

  async connect(): Promise<Result<void, Error>> {
    try {
      // Check for DATABASE_URL first (useful for tests and containerized environments)
      const databaseUrl = process.env['DATABASE_URL'];

      if (databaseUrl) {
        this.logger.info('Using DATABASE_URL for database connection');
        this.sequelize = new Sequelize(databaseUrl, {
          logging:
            config.NODE_ENV === 'development'
              ? msg => this.logger.debug('Sequelize', { query: msg })
              : false,
          define: {
            timestamps: true,
            underscored: false, // Changed to false to keep camelCase
            paranoid: true,
          },
        });
      } else {
        this.logger.info('Using individual database config variables');
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
            underscored: false, // Changed to false to keep camelCase
            paranoid: true,
          },
        });
      }

      await this.sequelize.authenticate();
      this.logger.info(
        `Database connected successfully (${this.sequelize.getDialect()})`
      );

      // Model registration is now handled by ModelRegistryService
      // Sync will be called after models are registered

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

  async sync(): Promise<Result<void, Error>> {
    try {
      if (!this.sequelize) {
        return Err(new Error('Database not connected'));
      }

      if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test') {
        this.logger.info('Syncing database schema...');

        try {
          // For test environment, use simpler sync to avoid timeouts
          if (config.NODE_ENV === 'test') {
            await this.sequelize.sync({
              force: false,
              logging: false, // Disable logging in tests
            });
            this.logger.info('Database synced - test environment (basic sync)');
          } else {
            // Development environment - try with alter: true first
            await this.sequelize.sync({
              force: false,
              alter: false,
            });
            this.logger.info('Database synced - tables created/updated');
          }
        } catch (syncError) {
          // If sync fails, try without altering existing structure
          this.logger.warn(
            'Initial sync failed, trying without alter...',
            syncError
          );

          try {
            await this.sequelize.sync({
              force: false,
              logging: config.NODE_ENV !== 'test', // Disable logging in tests
            });
            this.logger.info(
              'Database synced - tables created (no structural changes)'
            );
          } catch (finalError) {
            this.logger.error('Database sync failed completely');
            return Err(finalError as Error);
          }
        }
      }

      return Ok(undefined);
    } catch (error) {
      // This should not execute due to inner try/catch, but keep as safety net
      return Err(error as Error);
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
