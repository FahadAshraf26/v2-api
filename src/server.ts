import 'reflect-metadata';
import Fastify, { FastifyInstance } from 'fastify';
import { Result, Ok, Err } from 'oxide.ts';
import { container } from 'tsyringe';

import { config } from '@/config/app';
import { errorHandler } from '@/shared/errors/error-handler';
import { setupDependencyInjection } from '@/config/dependency-injection';
import { DatabaseService } from '@/infrastructure/database/database.service';
import { CacheService } from '@/infrastructure/cache/cache.service';

const buildApp = async (): Promise<Result<FastifyInstance, Error>> => {
  try {
    // Setup dependency injection
    await setupDependencyInjection();

    const loggerConfig: any = {
      level: config.LOG_LEVEL,
    };

    if (config.NODE_ENV === 'development') {
      loggerConfig.transport = { target: 'pino-pretty' };
    }

    const fastify = Fastify({
      logger: loggerConfig,
    });

    // Initialize database connection
    const databaseService = container.resolve(DatabaseService);
    await databaseService.connect();

    // Initialize cache connection
    const cacheService = container.resolve(CacheService);
    await cacheService.connect();

    // Register plugins
    await fastify.register(import('@fastify/helmet'));
    await fastify.register(import('@fastify/cors'), {
      origin: config.CORS_ORIGIN,
    });
    await fastify.register(import('@fastify/rate-limit'), {
      max: 100,
      timeWindow: '1 minute',
    });

    // Register swagger
    await fastify.register(import('@fastify/swagger'), {
      swagger: {
        info: {
          title: 'My API',
          description: 'API with Clean Architecture',
          version: '1.0.0',
        },
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json'],
      },
    });

    await fastify.register(import('@fastify/swagger-ui'), {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false,
      },
    });

    // Register error handler
    fastify.setErrorHandler(errorHandler);

    // Register routes
    await fastify.register(import('./presentation/routes'), {
      prefix: '/api/v1',
    });

    // Health check
    fastify.get('/health', async () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: await databaseService.healthCheck(),
        cache: await cacheService.healthCheck(),
      },
    }));

    // Graceful shutdown
    const gracefulShutdown = async (): Promise<void> => {
      fastify.log.info('Starting graceful shutdown...');

      await databaseService.disconnect();
      await cacheService.disconnect();
      await fastify.close();

      fastify.log.info('Graceful shutdown completed');
      process.exit(0);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    return Ok(fastify);
  } catch (error) {
    return Err(error as Error);
  }
};

const start = async (): Promise<void> => {
  const appResult = await buildApp();

  if (appResult.isErr()) {
    console.error('Failed to build app:', appResult.unwrapErr());
    process.exit(1);
  }

  const app = appResult.unwrap();

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    console.log(`Server listening on ${config.HOST}:${config.PORT}`);
    console.log(`API Documentation: http://${config.HOST}:${config.PORT}/docs`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();
