import { container } from 'tsyringe';

import { CampaignService } from '@/application/services/campaign.service';
import { DashboardCampaignInfoService } from '@/application/services/dashboard-campaign-info.service';
import { DashboardCampaignSummaryService } from '@/application/services/dashboard-campaign-summary.service';
import { DashboardReviewService } from '@/application/services/dashboard-review.service';
import { DashboardSocialsService } from '@/application/services/dashboard-socials.service';
import { DashboardSubmissionService } from '@/application/services/dashboard-submission.service';

import { CacheService } from '@/infrastructure/cache/cache.service';
import { DatabaseService } from '@/infrastructure/database/database.service';
import { ModelRegistryService } from '@/infrastructure/database/model-registry.service';
import { EventBus } from '@/infrastructure/events/event-bus';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { ApprovalHistoryMapper } from '@/infrastructure/mappers/approval-history.mapper';
import { CampaignInfoMapper } from '@/infrastructure/mappers/campaign-info.mapper';
import { CampaignMapper } from '@/infrastructure/mappers/campaign.mapper';
import { DashboardCampaignInfoMapper } from '@/infrastructure/mappers/dashboard-campaign-info.mapper';
import { DashboardCampaignSummaryMapper } from '@/infrastructure/mappers/dashboard-campaign-summary.mapper';
import { DashboardSocialsMapper } from '@/infrastructure/mappers/dashboard-socials.mapper';
import { IssuerMapper } from '@/infrastructure/mappers/issuer.mapper';
import { UserMapper } from '@/infrastructure/mappers/user.mapper';
import { SequelizeAdapter } from '@/infrastructure/persistence/orm/adapters/sequelize/sequelize.adapter';
import { ApprovalHistoryRepository } from '@/infrastructure/repositories/approval-history.repository';
import { CampaignInfoRepository } from '@/infrastructure/repositories/campaign-info.repository';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';
import { DashboardCampaignInfoRepository } from '@/infrastructure/repositories/dashboard-campaign-info.repository';
import { DashboardCampaignSummaryRepository } from '@/infrastructure/repositories/dashboard-campaign-summary.repository';
import { DashboardSocialsRepository } from '@/infrastructure/repositories/dashboard-socials.repository';
import { IssuerRepository } from '@/infrastructure/repositories/issuer.repository';
import { UserRepository } from '@/infrastructure/repositories/user.repository';

import { CampaignController } from '@/presentation/controllers/campaign.controller';
import { DashboardCampaignInfoController } from '@/presentation/controllers/dashboard-campaign-info.controller';
import { DashboardCampaignSummaryController } from '@/presentation/controllers/dashboard-campaign-summary.controller';
import { DashboardReviewController } from '@/presentation/controllers/dashboard-review.controller';
import { DashboardSocialsController } from '@/presentation/controllers/dashboard-socials.controller';
import { DashboardSubmissionController } from '@/presentation/controllers/dashboard-submission.controller';

import { ConfigService } from './config.service';
import { TOKENS } from './tokens';

export const initializeDependencyInjection = async (
  databaseService: DatabaseService,
  configService: ConfigService,
  logger: LoggerService
): Promise<void> => {
  // Core Services
  container.register<LoggerService>(LoggerService, { useValue: logger });
  container.registerSingleton(EventBus);
  container.register<ConfigService>(ConfigService, { useValue: configService });

  container.register<DatabaseService>(TOKENS.DatabaseServiceToken, {
    useValue: databaseService,
  });

  container.register<CacheService>(TOKENS.CacheServiceToken, {
    useClass: CacheService,
  });

  container.registerSingleton(TOKENS.ORMAdapterToken, SequelizeAdapter);

  container.register(TOKENS.ModelRegistryServiceToken, {
    useClass: ModelRegistryService,
  });

  // Mappers
  container.registerSingleton(TOKENS.CampaignMapperToken, CampaignMapper);
  container.registerSingleton(
    TOKENS.DashboardCampaignInfoMapperToken,
    DashboardCampaignInfoMapper
  );
  container.registerSingleton(
    TOKENS.DashboardCampaignSummaryMapperToken,
    DashboardCampaignSummaryMapper
  );
  container.registerSingleton(
    TOKENS.DashboardSocialsMapperToken,
    DashboardSocialsMapper
  );
  container.registerSingleton(ApprovalHistoryMapper);
  container.registerSingleton(CampaignInfoMapper);
  container.registerSingleton(IssuerMapper);
  container.registerSingleton(UserMapper);

  // Repositories
  container.registerSingleton(
    TOKENS.DashboardCampaignInfoRepositoryToken,
    DashboardCampaignInfoRepository
  );
  container.registerSingleton(
    TOKENS.DashboardCampaignSummaryRepositoryToken,
    DashboardCampaignSummaryRepository
  );
  container.registerSingleton(
    TOKENS.DashboardSocialsRepositoryToken,
    DashboardSocialsRepository
  );
  container.registerSingleton(ApprovalHistoryRepository);
  container.registerSingleton(
    TOKENS.CampaignRepositoryToken,
    CampaignRepository
  );
  container.registerSingleton(
    TOKENS.CampaignInfoRepositoryToken,
    CampaignInfoRepository
  );
  container.registerSingleton(TOKENS.IssuerRepositoryToken, IssuerRepository);
  container.registerSingleton(TOKENS.UserRepositoryToken, UserRepository);

  // Services
  container.registerSingleton(DashboardCampaignInfoService);
  container.registerSingleton(DashboardCampaignSummaryService);
  container.registerSingleton(DashboardSocialsService);
  container.registerSingleton(DashboardSubmissionService);
  container.registerSingleton(DashboardReviewService);
  container.registerSingleton(CampaignService);

  // Controllers
  container.registerSingleton(
    TOKENS.DashboardCampaignInfoControllerToken,
    DashboardCampaignInfoController
  );
  container.registerSingleton(
    TOKENS.DashboardCampaignSummaryControllerToken,
    DashboardCampaignSummaryController
  );
  container.registerSingleton(
    TOKENS.DashboardSocialsControllerToken,
    DashboardSocialsController
  );
  container.registerSingleton(
    TOKENS.DashboardSubmissionControllerToken,
    DashboardSubmissionController
  );
  container.registerSingleton(
    TOKENS.DashboardReviewControllerToken,
    DashboardReviewController
  );
  container.registerSingleton(
    TOKENS.CampaignControllerToken,
    CampaignController
  );
};
