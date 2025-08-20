import { Err, Ok, Result } from 'oxide.ts';
import { createClient, RedisClientType } from 'redis';
import { inject, injectable } from 'tsyringe';

import { ConfigService } from '@/config/config.service';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { RedisConfig } from '@/types/cache-service';

@injectable()
export class CacheService {
  private client: RedisClientType | null = null;

  constructor(
    @inject(LoggerService) private readonly logger: LoggerService,
    @inject(ConfigService) private readonly configService: ConfigService
  ) {}

  async connect(): Promise<Result<void, Error>> {
    try {
      const clientConfig: RedisConfig = {
        socket: {
          host: this.configService.get('REDIS_HOST') || 'localhost',
          port: Number(this.configService.get('REDIS_PORT') || 6379),
          connectTimeout: Number(
            this.configService.get('REDIS_CONNECT_TIMEOUT') || 5000
          ),
        },
        database: Number(this.configService.get('REDIS_DB') || 0),
      };

      const redisPassword = this.configService.get('REDIS_PASSWORD');
      if (redisPassword) {
        clientConfig.password = redisPassword;
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
      const expiration =
        ttl ?? Number(this.configService.get('CACHE_TTL_DEFAULT') || 3600);

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
