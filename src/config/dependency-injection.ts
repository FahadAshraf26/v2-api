export const TOKENS = {
  LoggerServiceToken: Symbol.for('LoggerService'),
  CacheServiceToken: Symbol.for('CacheService'),
  DatabaseServiceToken: Symbol.for('DatabaseService'),
  ORMAdapterToken: Symbol.for('ORMAdapter'),
  ModelRegistryServiceToken: Symbol.for('ModelRegistryService'),
  UserRepositoryToken: Symbol.for('UserRepository'),
  UserServiceToken: Symbol.for('UserService'),
  CreateUserUseCaseToken: Symbol.for('CreateUserUseCase'),
  GetUserUseCaseToken: Symbol.for('GetUserUseCase'),
  UserControllerToken: Symbol.for('UserController'),
  CampaignMapperToken: Symbol.for('CampaignMapper'),
  CampaignRepositoryToken: Symbol.for('CampaignRepository'),
  CampaignInfoRepositoryToken: Symbol.for('CampaignInfoRepository'),
  CampaignServiceToken: Symbol.for('CampaignService'),
  CampaignControllerToken: Symbol.for('CampaignController'),
  DashboardCampaignInfoMapperToken: Symbol.for('DashboardCampaignInfoMapper'),
  DashboardCampaignInfoRepositoryToken: Symbol.for(
    'DashboardCampaignInfoRepository'
  ),
  DashboardCampaignInfoServiceToken: Symbol.for('DashboardCampaignInfoService'),
  DashboardCampaignInfoControllerToken: Symbol.for(
    'DashboardCampaignInfoController'
  ),
  DashboardSocialsMapperToken: Symbol.for('DashboardSocialsMapper'),
  DashboardSocialsRepositoryToken: Symbol.for('DashboardSocialsRepository'),
  DashboardSocialsServiceToken: Symbol.for('DashboardSocialsService'),
  DashboardSocialsControllerToken: Symbol.for('DashboardSocialsController'),

  // MISSING TOKENS - ADDED
  SubmissionRepositoryToken: Symbol.for('SubmissionRepository'),
  SubmissionMapperToken: Symbol.for('SubmissionMapper'),
  DashboardApprovalRepositoryToken: Symbol.for('DashboardApprovalRepository'),
  DashboardCampaignSummaryRepositoryToken: Symbol.for(
    'DashboardCampaignSummaryRepository'
  ),
  DashboardCampaignSummaryMapperToken: Symbol.for(
    'DashboardCampaignSummaryMapper'
  ),
  DashboardCampaignSummaryServiceToken: Symbol.for(
    'DashboardCampaignSummaryService'
  ),
  DashboardCampaignSummaryControllerToken: Symbol.for(
    'DashboardCampaignSummaryController'
  ),
  SubmitDashboardItemsUseCaseToken: Symbol.for('SubmitDashboardItemsUseCase'),
  DashboardSubmissionControllerToken: Symbol.for(
    'DashboardSubmissionController'
  ),
} as const;

export const setupDependencyInjection = async (): Promise<void> => {
  const { container } = await import('tsyringe');
  const { LoggerService } = await import(
    '@/infrastructure/logging/logger.service'
  );
  const { CacheService } = await import('@/infrastructure/cache/cache.service');
  const { DatabaseService } = await import(
    '@/infrastructure/database/database.service'
  );
  const { SequelizeAdapter } = await import(
    '@/infrastructure/persistence/orm/adapters/sequelize/sequelize.adapter'
  );
  const { ModelRegistryService } = await import(
    '@/infrastructure/database/model-registry.service'
  );

  // Core services
  container.registerSingleton(TOKENS.LoggerServiceToken, LoggerService);
  container.registerSingleton(TOKENS.CacheServiceToken, CacheService);
  container.registerSingleton(TOKENS.DatabaseServiceToken, DatabaseService);
  container.registerSingleton(TOKENS.ORMAdapterToken, SequelizeAdapter);
  container.registerSingleton(
    TOKENS.ModelRegistryServiceToken,
    ModelRegistryService
  );

  // Campaign feature
  const { CampaignMapper } = await import(
    '@/infrastructure/mappers/campaign.mapper'
  );
  const { CampaignRepository } = await import(
    '@/infrastructure/repositories/campaign.repository'
  );
  const { CampaignInfoRepository } = await import(
    '@/infrastructure/repositories/campaign-info.repository'
  );

  container.registerSingleton(TOKENS.CampaignMapperToken, CampaignMapper);
  container.registerSingleton(
    TOKENS.CampaignRepositoryToken,
    CampaignRepository
  );
  container.registerSingleton(
    TOKENS.CampaignInfoRepositoryToken,
    CampaignInfoRepository
  );

  // Dashboard Campaign Info feature
  const { DashboardCampaignInfoMapper } = await import(
    '@/infrastructure/mappers/dashboard-campaign-info.mapper'
  );
  const { DashboardCampaignInfoRepository } = await import(
    '@/infrastructure/repositories/dashboard-campaign-info.repository'
  );
  const { DashboardCampaignInfoService } = await import(
    '@/application/services/dashboard-campaign-info.service'
  );
  const { DashboardCampaignInfoController } = await import(
    '@/presentation/controllers/dashboard-campaign-info.controller'
  );

  container.registerSingleton(
    TOKENS.DashboardCampaignInfoMapperToken,
    DashboardCampaignInfoMapper
  );
  container.registerSingleton(
    TOKENS.DashboardCampaignInfoRepositoryToken,
    DashboardCampaignInfoRepository
  );
  container.registerSingleton(
    TOKENS.DashboardCampaignInfoServiceToken,
    DashboardCampaignInfoService
  );
  container.registerSingleton(
    TOKENS.DashboardCampaignInfoControllerToken,
    DashboardCampaignInfoController
  );

  // Dashboard Campaign Summary feature
  const { DashboardCampaignSummaryMapper } = await import(
    '@/infrastructure/mappers/dashboard-campaign-summary.mapper'
  );
  const { DashboardCampaignSummaryRepository } = await import(
    '@/infrastructure/repositories/dashboard-campaign-summary.repository'
  );
  const { DashboardCampaignSummaryService } = await import(
    '@/application/services/dashboard-campaign-summary.service'
  );
  const { DashboardCampaignSummaryController } = await import(
    '@/presentation/controllers/dashboard-campaign-summary.controller'
  );

  container.registerSingleton(
    TOKENS.DashboardCampaignSummaryMapperToken,
    DashboardCampaignSummaryMapper
  );
  container.registerSingleton(
    TOKENS.DashboardCampaignSummaryRepositoryToken,
    DashboardCampaignSummaryRepository
  );
  container.registerSingleton(
    TOKENS.DashboardCampaignSummaryServiceToken,
    DashboardCampaignSummaryService
  );
  container.registerSingleton(
    TOKENS.DashboardCampaignSummaryControllerToken,
    DashboardCampaignSummaryController
  );

  // Dashboard Socials feature
  const { DashboardSocialsMapper } = await import(
    '@/infrastructure/mappers/dashboard-socials.mapper'
  );
  const { DashboardSocialsRepository } = await import(
    '@/infrastructure/repositories/dashboard-socials.repository'
  );
  const { DashboardSocialsService } = await import(
    '@/application/services/dashboard-socials.service'
  );
  const { DashboardSocialsController } = await import(
    '@/presentation/controllers/dashboard-socials.controller'
  );

  container.registerSingleton(
    TOKENS.DashboardSocialsMapperToken,
    DashboardSocialsMapper
  );
  container.registerSingleton(
    TOKENS.DashboardSocialsRepositoryToken,
    DashboardSocialsRepository
  );
  container.registerSingleton(
    TOKENS.DashboardSocialsServiceToken,
    DashboardSocialsService
  );
  container.registerSingleton(
    TOKENS.DashboardSocialsControllerToken,
    DashboardSocialsController
  );

  // NEW: Submission feature
  const { SubmissionMapper } = await import(
    '@/infrastructure/mappers/submission.mapper'
  );
  const { SubmissionRepository } = await import(
    '@/infrastructure/repositories/submission.repository'
  );

  container.registerSingleton(TOKENS.SubmissionMapperToken, SubmissionMapper);
  container.registerSingleton(
    TOKENS.SubmissionRepositoryToken,
    SubmissionRepository
  );

  // NEW: Approval feature
  const { DashboardApprovalRepository } = await import(
    '@/infrastructure/repositories/dashboard-approval.repository'
  );

  container.registerSingleton(
    TOKENS.DashboardApprovalRepositoryToken,
    DashboardApprovalRepository
  );

  // NEW: Use Cases
  const { SubmitDashboardItemsUseCase } = await import(
    '@/application/use-cases/submit-dashboard-items.use-case'
  );

  container.registerSingleton(
    TOKENS.SubmitDashboardItemsUseCaseToken,
    SubmitDashboardItemsUseCase
  );

  // NEW: Controllers
  const { DashboardSubmissionController } = await import(
    '@/presentation/controllers/dashboard-submission.controller'
  );

  container.registerSingleton(
    TOKENS.DashboardSubmissionControllerToken,
    DashboardSubmissionController
  );
};
