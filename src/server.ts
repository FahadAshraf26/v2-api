import 'reflect-metadata';

import { config as configDotenv } from 'dotenv';

import Fastify, { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { config } from '@/config/app';
import { initializeDependencyInjection } from '@/config/dependency-injection';
import { registerEventHandlers } from '@/config/event-handler-registrar';
import { TOKENS } from '@/config/tokens';

import { CacheService } from '@/infrastructure/cache/cache.service';
import { DatabaseService } from '@/infrastructure/database/database.service';
import { ModelRegistryService } from '@/infrastructure/database/model-registry.service';
import { LoggerService } from '@/infrastructure/logging/logger.service';

import { ErrorHandlerMiddleware } from '@/shared/utils/middleware/error-handler.middleware';

if (!process.env['ENV_LOADED']) {
  configDotenv();
  process.env['ENV_LOADED'] = 'true';
}

async function initializeServices(logger: LoggerService): Promise<{
  databaseService: DatabaseService;
  cacheService: CacheService | null;
}> {
  logger.info('🔧 Initializing services...');

  logger.info('📊 Connecting to database...');
  const databaseService = container.resolve<DatabaseService>(
    TOKENS.DatabaseServiceToken
  );
  const dbResult = await databaseService.connect();

  if (dbResult.isErr()) {
    logger.error('❌ Database connection failed', dbResult.unwrapErr());
    throw dbResult.unwrapErr();
  }
  logger.info('✅ Database connected successfully');

  logger.info('📋 Registering model schemas...');
  const modelRegistry = container.resolve<ModelRegistryService>(
    TOKENS.ModelRegistryServiceToken
  );
  await modelRegistry.registerAllModels();
  logger.info('✅ Model schemas registered successfully');

  // Sync database after models are registered
  logger.info('🔄 Syncing database schema...');
  const syncResult = await databaseService.sync();
  if (syncResult.isErr()) {
    logger.error('❌ Database sync failed');
    throw syncResult.unwrapErr();
  }
  logger.info('✅ Database schema synced successfully');

  let cacheService: CacheService | null = null;
  try {
    logger.info('💾 Connecting to Redis cache...');
    cacheService = container.resolve<CacheService>(TOKENS.CacheServiceToken);
    const cacheResult = await cacheService.connect();

    if (cacheResult.isErr()) {
      logger.warn(
        '⚠️  Redis connection failed, continuing without cache',
        cacheResult.unwrapErr() as unknown as Record<string, unknown>
      );
      cacheService = null;
    } else {
      logger.info('✅ Redis cache connected successfully');
    }
  } catch (error) {
    logger.warn(
      '⚠️  Redis initialization failed, continuing without cache',
      error as unknown as Record<string, unknown>
    );
    cacheService = null;
  }

  logger.info('✅ All services initialized successfully');

  return {
    databaseService,
    cacheService,
  };
}

async function createApp(logger: LoggerService): Promise<FastifyInstance> {
  logger.info('🏗️  Building Fastify application...');

  const app = Fastify({
    logger: false,
    disableRequestLogging: true,
    requestIdLogLabel: 'requestId',
    requestIdHeader: 'x-request-id',
  });

  // Add a custom serializer that respects toJSON methods
  app.setSerializerCompiler(() => {
    return data => {
      if (data && typeof data.toJSON === 'function') {
        return JSON.stringify(data.toJSON());
      }
      return JSON.stringify(data);
    };
  });

  logger.info('🔒 Registering security plugins...');
  const helmetOptions: Record<string, unknown> = {};
  if (config.NODE_ENV !== 'production') {
    helmetOptions['contentSecurityPolicy'] = false;
  }
  await app.register(import('@fastify/helmet'), helmetOptions);

  await app.register(import('@fastify/cors'), {
    origin: config.CORS_ORIGIN,
    credentials: false,
  });

  await app.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  });
  logger.info('✅ Security plugins registered');

  logger.info('📚 Setting up API documentation...');
  await app.register(import('@fastify/swagger'), {
    swagger: {
      info: {
        title: 'Honeycomb API V2',
        description: 'Clean Architecture API with DDD',
        version: '2.0.0',
      },
      host: `${config.HOST}:${config.PORT}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'x-auth-token',
          in: 'header',
          description: 'Bearer token for authentication',
        },
      },
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        {
          name: 'Dashboard Campaign Info',
          description: 'Dashboard campaign information management',
        },
        {
          name: 'Dashboard Campaign Info - Admin',
          description: 'Admin operations for dashboard campaign info',
        },
      ],
    },
  });

  await app.register(import('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
    },
    staticCSP: true,
    transformStaticCSP: header => header,
  });
  logger.info('✅ API documentation configured');
  const errorHandler = new ErrorHandlerMiddleware();
  app.setErrorHandler(errorHandler.handleError);

  logger.info('🛣️  Registering application routes...');
  await app.register(import('./presentation/routes'), {
    prefix: '/api/v2',
  });
  logger.info('✅ Routes registered');

  app.get(
    '/health',
    {
      schema: {
        description: 'Health check endpoint',
        tags: ['Health'],
        response: {
          200: {
            description: 'Successful response',
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              version: { type: 'string' },
              environment: { type: 'string' },
              uptime: { type: 'number' },
              services: {
                type: 'object',
                properties: {
                  database: { type: 'boolean' },
                  cache: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      const databaseService = container.resolve<DatabaseService>(
        TOKENS.DatabaseServiceToken
      );
      let cacheService: CacheService | null = null;
      let cacheHealthy = false;

      try {
        cacheService = container.resolve<CacheService>(
          TOKENS.CacheServiceToken
        );
        cacheHealthy = await cacheService.healthCheck();
      } catch {
        // Cache service not available
      }

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: config.NODE_ENV,
        uptime: process.uptime(),
        services: {
          database: await databaseService.healthCheck(),
          cache: cacheHealthy,
        },
      };
    }
  );

  logger.info('✅ Fastify application built successfully');

  return app;
}

function setupGracefulShutdown(
  app: FastifyInstance,
  services: {
    databaseService: DatabaseService;
    cacheService: CacheService | null;
  },
  logger: LoggerService
): void {
  const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info(`📛 ${signal} received, starting graceful shutdown...`);

    try {
      logger.info('🔌 Closing server connections...');
      await app.close();
      logger.info('✅ Server connections closed');

      logger.info('📊 Disconnecting database...');
      await services.databaseService.disconnect();
      logger.info('✅ Database disconnected');

      // Disconnect cache if it exists
      if (services.cacheService) {
        logger.info('💾 Disconnecting cache...');
        await services.cacheService.disconnect();
        logger.info('✅ Cache disconnected');
      }

      logger.info('✅ Graceful shutdown completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during graceful shutdown', error as Error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', error => {
    logger.fatal('❌ Uncaught Exception', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', reason => {
    logger.fatal('❌ Unhandled Rejection', reason as Error);
    gracefulShutdown('UNHANDLED_REJECTION');
  });
}

async function bootstrap(): Promise<void> {
  const logger = new LoggerService();

  logger.info('🚀 Starting Honeycomb API V2...');
  logger.info(`📅 Time: ${new Date().toISOString()}`);
  logger.info(`🔧 Environment: ${config.NODE_ENV}`);
  logger.info(`🔧 Node Version: ${process.version}`);
  logger.info('----------------------------------------');

  const databaseService = new DatabaseService(logger);

  try {
    // 1. Initialize Dependency Injection
    await initializeDependencyInjection(databaseService, logger);

    // 2. Resolve logger from the container
    const appLogger = container.resolve(LoggerService);

    appLogger.info('🚀 Starting Honeycomb API V2');
    appLogger.info(`Environment: ${config.NODE_ENV}`);
    appLogger.info(`Node Version: ${process.version}`);
    appLogger.info(`Process ID: ${process.pid}`);

    // 3. Initialize services (DB, Cache)
    const services = await initializeServices(appLogger);

    // 4. Register event handlers
    registerEventHandlers();

    // 5. Create Fastify app
    const app = await createApp(appLogger);

    // 6. Setup graceful shutdown
    setupGracefulShutdown(app, services, appLogger);

    appLogger.info('🌐 Starting HTTP server...');
    await app.listen({
      port: config.PORT,
      host: config.HOST,
    });

    appLogger.info('----------------------------------------');
    appLogger.info('✅ Server started successfully!');
    appLogger.info('----------------------------------------');
    appLogger.info('════════════════════════════════════════');
    appLogger.info('🎉 Honeycomb API V2 is ready!');
    appLogger.info('════════════════════════════════════════');
    appLogger.info(`🌐 Server: http://${config.HOST}:${config.PORT}`);
    appLogger.info(`📚 API Docs: http://${config.HOST}:${config.PORT}/docs`);
    appLogger.info(`🏥 Health: http://${config.HOST}:${config.PORT}/health`);
    appLogger.info('════════════════════════════════════════');

    const memoryUsage = process.memoryUsage();
    appLogger.info('💾 Memory Usage:', {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
    });
  } catch (error) {
    logger.error('❌ Failed to start server', error as Error);
    process.exit(1);
  }
}

// Export functions for testing
export { createApp, initializeServices };

// Only run bootstrap if this file is executed directly (not imported)
if (require.main === module) {
  bootstrap().catch(error => {
    const logger = new LoggerService();
    logger.fatal('Fatal error during bootstrap', error as Error);
    // Don't exit process in test environment to avoid breaking tests
    if (process.env['NODE_ENV'] !== 'test') {
      process.exit(1);
    }
  });
}
