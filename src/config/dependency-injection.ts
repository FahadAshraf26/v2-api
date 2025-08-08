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
  const { CampaignMapper } = await import(
    '@/infrastructure/mappers/campaign.mapper'
  );
  const { CampaignRepository } = await import(
    '@/infrastructure/repositories/campaign.repository'
  );
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

  // Core services
  container.registerSingleton(TOKENS.LoggerServiceToken, LoggerService);
  container.registerSingleton(TOKENS.CacheServiceToken, CacheService);
  container.registerSingleton(TOKENS.DatabaseServiceToken, DatabaseService);

  // ORM abstraction layer
  container.registerSingleton(TOKENS.ORMAdapterToken, SequelizeAdapter);
  container.registerSingleton(
    TOKENS.ModelRegistryServiceToken,
    ModelRegistryService
  );

  // Campaign feature
  container.registerSingleton(TOKENS.CampaignMapperToken, CampaignMapper);
  container.registerSingleton(
    TOKENS.CampaignRepositoryToken,
    CampaignRepository
  );

  // Dashboard Campaign Info feature
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
};
