import { inject, injectable } from 'tsyringe';
import { container } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';

import { ApprovalHistorySchema } from './models/approval-history.model';
import { CampaignInfoSchema } from './models/campaign-info.model';
import { CampaignTagSchema } from './models/campaign-tag.model';
import { CampaignSchema } from './models/campaign.model';
// Import all model schemas
import { DashboardCampaignInfoSchema } from './models/dashboard-campaign-info.model';
import { DashboardCampaignSummarySchema } from './models/dashboard-campaign-summary.model';
import { DashboardSocialsSchema } from './models/dashboard-socials.model';
import { InvestorSchema } from './models/investor.model';
import { OwnerSchema } from './models/owner.model';
import { RoughBudgetSchema } from './models/rough-budget.model';
import { TagCategoriesSchema } from './models/tag-categories';
import { TagSchema } from './models/tag.model';
import { UserSchema } from './models/user.model';

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
        // Core schemas
        CampaignSchema,
        CampaignInfoSchema,
        RoughBudgetSchema,

        // Tag-related schemas
        TagCategoriesSchema,
        TagSchema,
        CampaignTagSchema,

        // Dashboard schemas
        DashboardCampaignInfoSchema,
        DashboardCampaignSummarySchema,
        DashboardSocialsSchema,
        ApprovalHistorySchema,
        UserSchema,
        InvestorSchema,
        OwnerSchema,
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
    return [
      'Campaign',
      'CampaignInfo',
      'RoughBudget',
      'TagCategories',
      'Tag',
      'CampaignTag',
      'DashboardCampaignInfo',
      'DashboardCampaignSummary',
      'DashboardSocials',
      'ApprovalHistory',
      'User',
      'Investor',
      'Owner',
    ];
  }
}
