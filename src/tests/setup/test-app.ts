import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { DatabaseService } from '@/infrastructure/database/database.service';
import { CacheService } from '@/infrastructure/cache/cache.service';
import { setupDependencyInjection } from '@/config/dependency-injection';
import { randomUUID } from 'crypto';

// Import individual functions instead of importing from server to avoid bootstrap execution
import { createApp, initializeServices } from '@/server';
import { TOKENS } from '@/config/dependency-injection';
import { ModelRegistryService } from '@/infrastructure/database/model-registry.service';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';

export interface TestApp {
  app: FastifyInstance;
  cleanup: () => Promise<void>;
  clearDatabase: () => Promise<void>;
  createTestCampaign: (campaignId: string) => Promise<void>;
}

export interface AuthTokens {
  userToken: string;
  adminToken: string;
}

/**
 * Create a test application instance
 */
export async function createTestApp(): Promise<TestApp> {
  // Setup dependency injection for test
  await setupDependencyInjection();

  // Get logger
  const logger = container.resolve(LoggerService);

  // Initialize services (database, cache, models)
  const services = await initializeServices(logger);

  // Create Fastify app
  const app = await createApp(logger);

  const cleanup = async () => {
    try {
      await app.close();
      await services.databaseService.disconnect();
      if (services.cacheService) {
        await services.cacheService.disconnect();
      }
    } catch (error) {
      console.error('Test cleanup error:', error);
    }
  };

  return {
    app,
    cleanup,
    clearDatabase: async () => {
      try {
        const databaseService = container.resolve(DatabaseService);

        // Ensure database is connected
        const isConnected = await databaseService.healthCheck();
        if (!isConnected) {
          console.warn('Database not connected, attempting to connect...');
          const connectResult = await databaseService.connect();
          if (connectResult.isErr()) {
            console.warn(
              'Failed to connect to database:',
              connectResult.unwrapErr()
            );
            return;
          }
        }

        const sequelize = databaseService.getSequelize();

        if (!sequelize) {
          console.warn(
            'Database sequelize instance not available, skipping cleanup'
          );
          return;
        }

        // Get all model names
        const modelNames = Object.keys(sequelize.models);

        if (modelNames.length === 0) {
          console.warn('No models registered, skipping cleanup');
          return;
        }

        // For SQLite (used in tests), simply truncate all tables
        if (sequelize.getDialect() === 'sqlite') {
          for (const modelName of modelNames) {
            const model = sequelize.models[modelName];
            if (model) {
              await model.destroy({ where: {}, truncate: true });
            }
          }
        } else {
          // For other databases, disable foreign key checks temporarily
          await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
          for (const modelName of modelNames) {
            const model = sequelize.models[modelName];
            if (model) {
              await model.destroy({ where: {}, truncate: true });
            }
          }
          await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        }

        console.log('Database cleared successfully');
      } catch (error) {
        console.error('Error clearing database:', error);
        // Don't throw - let tests continue
      }
    },
    createTestCampaign: async (campaignId: string) => {
      try {
        const databaseService = container.resolve(DatabaseService);

        // Ensure database is connected
        const isConnected = await databaseService.healthCheck();
        if (!isConnected) {
          console.warn('Database not connected, attempting to connect...');
          const connectResult = await databaseService.connect();
          if (connectResult.isErr()) {
            throw new Error(
              `Failed to connect to database: ${connectResult.unwrapErr().message}`
            );
          }
        }

        const sequelize = databaseService.getSequelize();

        if (!sequelize) {
          throw new Error('Database sequelize instance not available');
        }

        // Wait a bit for models to be registered if they're not available yet
        let CampaignModel = sequelize.models['Campaign'];
        if (!CampaignModel) {
          console.log('Campaign model not found, waiting for registration...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          CampaignModel = sequelize.models['Campaign'];
        }

        // Use raw SQL to ensure the campaign exists, bypassing model issues
        if (!CampaignModel) {
          console.log('Using raw SQL to create campaign...');
          await sequelize.query(`
            INSERT INTO campaigns (
              campaignId, campaignName, campaignTargetAmount, campaignMinimumAmount,
              investmentType, slug, isChargeFee, isChargeStripe, isCampaignAddress,
              isShowOnExplorePage, createdAt, updatedAt
            ) VALUES (
              '${campaignId}', 'Test Campaign ${campaignId}', 100000, 1000,
              'equity', 'test-campaign-${campaignId}', false, false, false,
              true, datetime('now'), datetime('now')
            )
          `);
        } else {
          // Create using Sequelize model directly
          await CampaignModel.create({
            campaignId,
            campaignName: `Test Campaign ${campaignId}`,
            campaignTargetAmount: 100000,
            campaignMinimumAmount: 1000,
            investmentType: 'equity',
            slug: `test-campaign-${campaignId}`,
            isChargeFee: false,
            isChargeStripe: false,
            isCampaignAddress: false,
            isShowOnExplorePage: true,
          });
        }

        console.log(`Test campaign created with ID: ${campaignId}`);

        // Verify the campaign was actually created
        const result = await sequelize.query(
          `SELECT campaignId FROM campaigns WHERE campaignId = '${campaignId}'`
        );
        if (result[0].length === 0) {
          throw new Error(
            `Campaign verification failed - campaign not found: ${campaignId}`
          );
        }
        console.log(`✅ Campaign verified in database: ${campaignId}`);
      } catch (error) {
        console.error('Error creating test campaign:', error);
        throw error;
      }
    },
  };
}

/**
 * Create mock authentication tokens for testing
 * In a real implementation, you would generate proper JWTs
 */
export async function createAuthTokens(): Promise<AuthTokens> {
  const userId = randomUUID();
  const adminUserId = randomUUID();

  // Create simple JWT-like tokens for testing
  // In production, use a proper JWT library
  const userPayload = {
    type: 'user',
    userId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  };

  const adminPayload = {
    type: 'admin',
    adminUserId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  };

  // Create base64 encoded tokens (simplified for testing)
  const userToken = `header.${Buffer.from(JSON.stringify(userPayload)).toString('base64url')}.signature`;
  const adminToken = `header.${Buffer.from(JSON.stringify(adminPayload)).toString('base64url')}.signature`;

  return {
    userToken,
    adminToken,
  };
}

/**
 * Clear database for clean test state
 * @deprecated Use testApp.clearDatabase() instead for better reliability
 */
export async function clearDatabase(): Promise<void> {
  try {
    const databaseService = container.resolve(DatabaseService);

    // Check if database is connected
    const sequelize = databaseService.getSequelize();
    if (!sequelize) {
      console.warn('Database not connected, skipping cleanup');
      return;
    }

    // Get all model names
    const modelNames = Object.keys(sequelize.models);

    if (modelNames.length === 0) {
      // No models registered yet, skip cleanup
      console.warn('No models registered, skipping cleanup');
      return;
    }

    // For SQLite (used in tests), we don't need foreign key constraint handling
    if (sequelize.getDialect() === 'sqlite') {
      // Simply truncate all tables for SQLite
      for (const modelName of modelNames) {
        const model = sequelize.model(modelName);
        await model.destroy({ where: {}, truncate: true });
      }
    } else {
      // For other databases, handle foreign key constraints
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

      for (const modelName of modelNames) {
        const model = sequelize.model(modelName);
        await model.truncate({ cascade: true, restartIdentity: true });
      }

      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    }
  } catch (error) {
    console.warn('Database cleanup error (continuing):', error);
    // Don't throw - tests should continue even if cleanup fails
  }
}

/**
 * Create test data helpers
 */
export const testHelpers = {
  /**
   * Create a test user ID
   */
  createUserId(): string {
    return randomUUID();
  },

  /**
   * Create a test campaign ID
   */
  createCampaignId(): string {
    return randomUUID();
  },

  /**
   * Wait for a specified time (useful for async operations)
   */
  async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Create test dashboard campaign info data
   */
  createDashboardCampaignInfoData(overrides: Partial<any> = {}) {
    return {
      campaignId: randomUUID(),
      milestones: 'Test milestones for campaign',
      investorPitch: 'Test investor pitch content',
      isShowPitch: true,
      investorPitchTitle: 'Test Investor Pitch Title',
      ...overrides,
    };
  },
};

/**
 * Test database setup and teardown
 */
export const testDatabase = {
  /**
   * Setup test database (run before all tests)
   */
  async setup(): Promise<void> {
    await setupDependencyInjection();
    const logger = container.resolve(LoggerService);
    await initializeServices(logger);
  },

  /**
   * Teardown test database (run after all tests)
   */
  async teardown(): Promise<void> {
    try {
      const databaseService = container.resolve(DatabaseService);
      await databaseService.disconnect();

      const cacheService = container.resolve(CacheService);
      if (cacheService) {
        await cacheService.disconnect();
      }
    } catch (error) {
      console.error('Test teardown error:', error);
    }
  },

  /**
   * Clean database (run before each test)
   */
  async clean(): Promise<void> {
    await clearDatabase();
  },
};
