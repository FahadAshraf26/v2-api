import { injectable, inject } from 'tsyringe';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { TOKENS } from '@/config/dependency-injection';
import { container } from 'tsyringe';

// Import all model schemas
import { DashboardCampaignInfoSchema } from './models/dashboard-campaign-info.model';
import { DashboardCampaignSummarySchema } from './models/dashboard-campaign-summary.model';
import { CampaignSchema } from './models/campaign.model';
import { DashboardApprovalSchema } from './models/dashboardApproval.model';

@injectable()
export class ModelRegistryService {
  constructor(@inject(LoggerService) private readonly logger: LoggerService) {}

  /**
   * Register all model schemas with the ORM adapter
   * This maintains ORM abstraction while enabling schema-based model definition
   */
  async registerAllModels(): Promise<void> {
    this.logger.info('📋 Registering model schemas with ORM adapter...');

    try {
      // Get ORM adapter when needed (after database is connected)
      const ormAdapter = container.resolve<IORMAdapter>(TOKENS.ORMAdapterToken);

      // Register all schemas
      const schemas = [
        CampaignSchema,
        DashboardCampaignInfoSchema,
        DashboardCampaignSummarySchema,
        DashboardApprovalSchema,
        // Add other model schemas here as they are created
      ];

      for (const schema of schemas) {
        this.logger.debug(`Registering schema: ${schema.name}`);
        ormAdapter.registerSchema(schema);
      }

      // Setup associations after all models are registered
      if (
        'setupAssociations' in ormAdapter &&
        typeof ormAdapter.setupAssociations === 'function'
      ) {
        ormAdapter.setupAssociations();
        this.logger.debug('✅ Model associations setup completed');
      }

      this.logger.info(
        `✅ Successfully registered ${schemas.length} model schemas with associations`
      );
    } catch (error) {
      this.logger.error('❌ Failed to register model schemas', error as Error);
      throw error;
    }
  }

  /**
   * Register a single model schema
   */
  registerModel(schema: any): void {
    this.logger.debug(`Registering single schema: ${schema.name}`);
    const ormAdapter = container.resolve<IORMAdapter>(TOKENS.ORMAdapterToken);
    ormAdapter.registerSchema(schema);
  }

  /**
   * Get available registered models
   */
  getRegisteredModels(): string[] {
    // This would need to be implemented in the ORM adapter interface
    // For now, return the known model names
    return ['Campaign', 'DashboardCampaignInfo'];
  }
}
