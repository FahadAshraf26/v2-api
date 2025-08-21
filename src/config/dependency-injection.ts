import { container } from 'tsyringe';

import { CampaignService } from '@/application/services/campaign.service';
import { DashboardCampaignInfoService } from '@/application/services/dashboard-campaign-info.service';
import { DashboardCampaignSummaryService } from '@/application/services/dashboard-campaign-summary.service';
import { DashboardOwnersService } from '@/application/services/dashboard-owners.service';
import { DashboardReviewService } from '@/application/services/dashboard-review.service';
import { DashboardSocialsService } from '@/application/services/dashboard-socials.service';
import { DashboardSubmissionService } from '@/application/services/dashboard-submission.service';
import { SaveDashboardChangesUseCase } from '@/application/use-cases/dashboard/save-dashboard-changes.use-case';

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
import { DashboardOwnersMapper } from '@/infrastructure/mappers/dashboard-owners.mapper';
import { DashboardSocialsMapper } from '@/infrastructure/mappers/dashboard-socials.mapper';
import { IssuerMapper } from '@/infrastructure/mappers/issuer.mapper';
import { UserMapper } from '@/infrastructure/mappers/user.mapper';
import { SequelizeAdapter } from '@/infrastructure/persistence/orm/adapters/sequelize/sequelize.adapter';
import { ApprovalHistoryRepository } from '@/infrastructure/repositories/approval-history.repository';
import { CampaignInfoRepository } from '@/infrastructure/repositories/campaign-info.repository';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';
import { DashboardCampaignInfoRepository } from '@/infrastructure/repositories/dashboard-campaign-info.repository';
import { DashboardCampaignSummaryRepository } from '@/infrastructure/repositories/dashboard-campaign-summary.repository';
import { DashboardOwnersRepository } from '@/infrastructure/repositories/dashboard-owners.repository';
import { DashboardSocialsRepository } from '@/infrastructure/repositories/dashboard-socials.repository';
import { IssuerRepository } from '@/infrastructure/repositories/issuer.repository';
import { OwnerRepository } from '@/infrastructure/repositories/owner.repository';
import { UserRepository } from '@/infrastructure/repositories/user.repository';

import { CampaignController } from '@/presentation/controllers/campaign.controller';
import { DashboardCampaignInfoController } from '@/presentation/controllers/dashboard-campaign-info.controller';
import { DashboardCampaignSummaryController } from '@/presentation/controllers/dashboard-campaign-summary.controller';
import { DashboardOwnersController } from '@/presentation/controllers/dashboard-owners.controller';
import { DashboardReviewController } from '@/presentation/controllers/dashboard-review.controller';
import { DashboardSocialsController } from '@/presentation/controllers/dashboard-socials.controller';
import { DashboardSubmissionController } from '@/presentation/controllers/dashboard-submission.controller';
import { DashboardController } from '@/presentation/controllers/dashboard.controller';

import { TOKENS } from './tokens';

export const initializeDependencyInjection = async (
  databaseService: DatabaseService,
  logger: LoggerService
): Promise<void> => {
  // Core Services
  container.register<LoggerService>(LoggerService, { useValue: logger });
  container.registerSingleton(EventBus);

  container.register<DatabaseService>(TOKENS.DatabaseServiceToken, {
    useValue: databaseService,
  });

  const cacheService = new CacheService(logger);
  container.register<CacheService>(TOKENS.CacheServiceToken, {
    useValue: cacheService,
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
  container.registerSingleton(DashboardOwnersMapper);
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
  container.registerSingleton(DashboardOwnersRepository);
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
  container.registerSingleton(TOKENS.OwnerRepositoryToken, OwnerRepository);

  // Services
  container.registerSingleton(DashboardCampaignInfoService);
  container.registerSingleton(DashboardCampaignSummaryService);
  container.registerSingleton(DashboardSocialsService);
  container.registerSingleton(DashboardSubmissionService);
  container.registerSingleton(DashboardReviewService);
  container.registerSingleton(CampaignService);
  container.registerSingleton(DashboardOwnersService);

  // Use Cases
  container.registerSingleton(SaveDashboardChangesUseCase);

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
  container.registerSingleton(DashboardOwnersController);
  container.registerSingleton(
    TOKENS.DashboardReviewControllerToken,
    DashboardReviewController
  );
  container.registerSingleton(
    TOKENS.CampaignControllerToken,
    CampaignController
  );
  container.registerSingleton(DashboardController);
};
