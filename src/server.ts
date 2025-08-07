// src/server.ts
import 'reflect-metadata';

// Load environment variables ONCE at the very beginning
if (!process.env['ENV_LOADED']) {
  require('dotenv').config();
  process.env['ENV_LOADED'] = 'true';
}

import Fastify, { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';
import { config } from '@/config/app';
import { setupDependencyInjection } from '@/config/dependency-injection';
import { DatabaseService } from '@/infrastructure/database/database.service';
import { CacheService } from '@/infrastructure/cache/cache.service';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { errorHandler } from '@/shared/errors/error-handler';

async function initializeServices(logger: LoggerService): Promise<{
  databaseService: DatabaseService;
  cacheService: CacheService | null;
}> {
  logger.info('🔧 Initializing services...');

  // Initialize Database
  logger.info('📊 Connecting to database...');
  const databaseService = container.resolve(DatabaseService);
  const dbResult = await databaseService.connect();

  if (dbResult.isErr()) {
    logger.error('❌ Database connection failed', dbResult.unwrapErr());
    throw dbResult.unwrapErr();
  }
  logger.info('✅ Database connected successfully');

  // Initialize Cache (Redis) - Optional, don't fail if not available
  let cacheService: CacheService | null = null;
  try {
    logger.info('💾 Connecting to Redis cache...');
    cacheService = container.resolve(CacheService);
    const cacheResult = await cacheService.connect();

    if (cacheResult.isErr()) {
      logger.warn(
        '⚠️  Redis connection failed, continuing without cache',
        cacheResult.unwrapErr()
      );
      cacheService = null;
    } else {
      logger.info('✅ Redis cache connected successfully');
    }
  } catch (cacheError) {
    logger.warn(
      '⚠️  Cache service initialization failed, continuing without cache',
      cacheError as Error
    );
    cacheService = null;
  }

  logger.info('✅ All services initialized');

  return { databaseService, cacheService };
}

async function createApp(logger: LoggerService): Promise<FastifyInstance> {
  logger.info('🏗️  Building Fastify application...');

  // Create Fastify instance with DISABLED internal logging to prevent duplicates
  const app = Fastify({
    logger: false, // Disable Fastify's internal logger to prevent duplicate logs
    disableRequestLogging: true,
    requestIdLogLabel: 'requestId',
    requestIdHeader: 'x-request-id',
  });

  // Register security plugins
  logger.info('🔒 Registering security plugins...');
  const helmetOptions: any = {};
  if (config.NODE_ENV !== 'production') {
    helmetOptions.contentSecurityPolicy = false;
  }
  await app.register(import('@fastify/helmet'), helmetOptions);

  await app.register(import('@fastify/cors'), {
    origin: config.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  });
  logger.info('✅ Security plugins registered');

  // Register Swagger documentation
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
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        // Add more tags as you add more routes
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

  // Set global error handler
  app.setErrorHandler(errorHandler);

  // Register application routes
  logger.info('🛣️  Registering application routes...');
  await app.register(import('./presentation/routes'), {
    prefix: '/api/v2',
  });
  logger.info('✅ Routes registered');

  // Register health check endpoint
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
      const databaseService = container.resolve(DatabaseService);
      let cacheService: CacheService | null = null;
      let cacheHealthy = false;

      try {
        cacheService = container.resolve(CacheService);
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
      // Close server to stop accepting new connections
      logger.info('🔌 Closing server connections...');
      await app.close();
      logger.info('✅ Server connections closed');

      // Disconnect database
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

  // Register shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', error => {
    logger.fatal('❌ Uncaught Exception', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.fatal('❌ Unhandled Rejection', reason as Error);
    gracefulShutdown('UNHANDLED_REJECTION');
  });
}

async function bootstrap(): Promise<void> {
  console.log('🚀 Starting Honeycomb API V2...');
  console.log(`📅 Time: ${new Date().toISOString()}`);
  console.log(`🔧 Environment: ${config.NODE_ENV}`);
  console.log(`🔧 Node Version: ${process.version}`);
  console.log('----------------------------------------');

  // Setup dependency injection
  await setupDependencyInjection();

  // Get logger instance
  const logger = container.resolve(LoggerService);
  logger.info('🚀 Starting Honeycomb API V2');
  logger.info(`Environment: ${config.NODE_ENV}`);
  logger.info(`Node Version: ${process.version}`);
  logger.info(`Process ID: ${process.pid}`);

  try {
    // Step 1: Initialize all services (Database, Cache, etc.)
    const services = await initializeServices(logger);

    // Step 2: Create and configure Fastify app
    const app = await createApp(logger);

    // Step 3: Setup graceful shutdown handlers
    setupGracefulShutdown(app, services, logger);

    // Step 4: Start listening for requests
    logger.info('🌐 Starting HTTP server...');
    await app.listen({
      port: config.PORT,
      host: config.HOST,
    });

    // Step 5: Log successful startup
    console.log('----------------------------------------');
    console.log('✅ Server started successfully!');
    console.log('----------------------------------------');
    logger.info('════════════════════════════════════════');
    logger.info('🎉 Honeycomb API V2 is ready!');
    logger.info('════════════════════════════════════════');
    logger.info(`🌐 Server: http://${config.HOST}:${config.PORT}`);
    logger.info(`📚 API Docs: http://${config.HOST}:${config.PORT}/docs`);
    logger.info(`🏥 Health: http://${config.HOST}:${config.PORT}/health`);
    logger.info('════════════════════════════════════════');

    // Log memory usage
    const memoryUsage = process.memoryUsage();
    logger.info('💾 Memory Usage:', {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
    });
  } catch (error) {
    logger.error('❌ Failed to start server', error as Error);
    console.error('----------------------------------------');
    console.error('❌ Server startup failed!');
    console.error('Error:', (error as Error).message);
    console.error('----------------------------------------');
    process.exit(1);
  }
}

// Start the application
bootstrap().catch(error => {
  console.error('💥 Fatal error during bootstrap:', error);
  process.exit(1);
});

// Export for testing purposes
export { bootstrap, createApp, initializeServices };
