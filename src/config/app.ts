import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(8082),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  CORS_ORIGIN: z.string().default('*'),

  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_NAME: z.string().default('myapi_db'),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_POOL_MAX: z.coerce.number().default(20),
  DB_POOL_MIN: z.coerce.number().default(5),
  DB_POOL_ACQUIRE: z.coerce.number().default(30000),
  DB_POOL_IDLE: z.coerce.number().default(10000),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_CONNECT_TIMEOUT: z.coerce.number().default(10000),
  REDIS_COMMAND_TIMEOUT: z.coerce.number().default(5000),

  // Cache TTL (in seconds)
  CACHE_TTL_DEFAULT: z.coerce.number().default(3600), // 1 hour
  CACHE_TTL_SHORT: z.coerce.number().default(300), // 5 minutes
  CACHE_TTL_LONG: z.coerce.number().default(86400), // 24 hours
});

export const config = envSchema.parse(process.env);
