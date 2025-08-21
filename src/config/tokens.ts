export const TOKENS = {
  // Core
  LoggerServiceToken: Symbol.for('LoggerServiceToken'),
  CacheServiceToken: Symbol.for('CacheServiceToken'),
  DatabaseServiceToken: Symbol.for('DatabaseServiceToken'),
  ORMAdapterToken: Symbol.for('ORMAdapterToken'),
  ModelRegistryServiceToken: Symbol.for('ModelRegistryServiceToken'),

  // Repositories
  CampaignRepositoryToken: Symbol.for('CampaignRepositoryToken'),
  CampaignInfoRepositoryToken: Symbol.for('CampaignInfoRepositoryToken'),
  DashboardCampaignInfoRepositoryToken: Symbol.for(
    'DashboardCampaignInfoRepositoryToken'
  ),
  DashboardCampaignSummaryRepositoryToken: Symbol.for(
    'DashboardCampaignSummaryRepositoryToken'
  ),
  DashboardSocialsRepositoryToken: Symbol.for(
    'DashboardSocialsRepositoryToken'
  ),
  IssuerRepositoryToken: Symbol.for('IssuerRepositoryToken'),
  UserRepositoryToken: Symbol.for('UserRepositoryToken'),
  OwnerRepositoryToken: Symbol.for('OwnerRepositoryToken'),

  // Mappers
  CampaignMapperToken: Symbol.for('CampaignMapperToken'),
  DashboardCampaignInfoMapperToken: Symbol.for(
    'DashboardCampaignInfoMapperToken'
  ),
  DashboardCampaignSummaryMapperToken: Symbol.for(
    'DashboardCampaignSummaryMapperToken'
  ),
  DashboardSocialsMapperToken: Symbol.for('DashboardSocialsMapperToken'),

  // Services
  DashboardCampaignInfoServiceToken: Symbol.for(
    'DashboardCampaignInfoServiceToken'
  ),
  DashboardCampaignSummaryServiceToken: Symbol.for(
    'DashboardCampaignSummaryServiceToken'
  ),
  DashboardSocialsServiceToken: Symbol.for('DashboardSocialsServiceToken'),
  DashboardSubmissionServiceToken: Symbol.for(
    'DashboardSubmissionServiceToken'
  ),
  DashboardReviewServiceToken: Symbol.for('DashboardReviewServiceToken'),

  // Controllers
  DashboardCampaignInfoControllerToken: Symbol.for(
    'DashboardCampaignInfoControllerToken'
  ),
  DashboardCampaignSummaryControllerToken: Symbol.for(
    'DashboardCampaignSummaryControllerToken'
  ),
  DashboardSocialsControllerToken: Symbol.for(
    'DashboardSocialsControllerToken'
  ),
  DashboardSubmissionControllerToken: Symbol.for(
    'DashboardSubmissionControllerToken'
  ),
  DashboardReviewControllerToken: Symbol.for('DashboardReviewControllerToken'),
  CampaignControllerToken: Symbol.for('CampaignControllerToken'),
};
