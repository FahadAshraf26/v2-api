import { createClient, RedisClientType } from 'redis';
import { inject, injectable } from 'tsyringe';
import { Result, Ok, Err } from 'oxide.ts';
import { config } from '@/config/app';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { RedisConfig } from '@/shared/types/redis-config';

@injectable()
export class CacheService {
  private client: RedisClientType | null = null;

  constructor(@inject(LoggerService) private readonly logger: LoggerService) {}

  async connect(): Promise<Result<void, Error>> {
    try {
      const clientConfig: RedisConfig = {
        socket: {
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
          connectTimeout: config.REDIS_CONNECT_TIMEOUT,
        },
        database: config.REDIS_DB,
      };

      if (config.REDIS_PASSWORD) {
        clientConfig.password = config.REDIS_PASSWORD;
      }

      this.client = createClient(clientConfig);

      this.client.on('error', err => {
        this.logger.error('Redis Client Error', err);
      });

      await this.client.connect();
      return Ok(undefined);
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error as Error);
      return Err(error as Error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) return false;
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async get<T>(key: string): Promise<Result<T | null, Error>> {
    try {
      if (!this.client) {
        return Err(new Error('Cache not connected'));
      }

      const value = await this.client.get(key);
      if (value === null) {
        return Ok(null);
      }

      const parsed = JSON.parse(value) as T;
      return Ok(parsed);
    } catch (error) {
      return Err(error as Error);
    }
  }

  async set(
    key: string,
    value: unknown,
    ttl?: number
  ): Promise<Result<void, Error>> {
    try {
      if (!this.client) {
        return Err(new Error('Cache not connected'));
      }

      const stringValue = JSON.stringify(value);
      const expiration = ttl ?? config.CACHE_TTL_DEFAULT;

      await this.client.setEx(key, expiration, stringValue);
      return Ok(undefined);
    } catch (error) {
      return Err(error as Error);
    }
  }

  async delete(key: string): Promise<Result<void, Error>> {
    try {
      if (!this.client) {
        return Err(new Error('Cache not connected'));
      }

      await this.client.del(key);
      return Ok(undefined);
    } catch (error) {
      return Err(error as Error);
    }
  }

  async exists(key: string): Promise<Result<boolean, Error>> {
    try {
      if (!this.client) {
        return Err(new Error('Cache not connected'));
      }

      const result = await this.client.exists(key);
      return Ok(result === 1);
    } catch (error) {
      return Err(error as Error);
    }
  }

  async flush(): Promise<Result<void, Error>> {
    try {
      if (!this.client) {
        return Err(new Error('Cache not connected'));
      }

      await this.client.flushDb();
      return Ok(undefined);
    } catch (error) {
      return Err(error as Error);
    }
  }
}
