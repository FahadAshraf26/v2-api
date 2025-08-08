import {
  NotFoundError,
  ConflictError,
  ValidationError,
  UnauthorizedError,
} from '@/domain/errors/base-errors';

export class DashboardCampaignInfoNotFoundError extends NotFoundError {
  readonly code = 'DASHBOARD_CAMPAIGN_INFO_NOT_FOUND';

  constructor(id: string) {
    super(`Dashboard campaign info with ID ${id} not found`);
  }
}

export class DashboardCampaignInfoAlreadyExistsError extends ConflictError {
  readonly code = 'DASHBOARD_CAMPAIGN_INFO_ALREADY_EXISTS';

  constructor(campaignId: string) {
    super(`Dashboard campaign info for campaign ${campaignId} already exists`);
  }
}

export class DashboardCampaignInfoValidationError extends ValidationError {
  readonly code = 'DASHBOARD_CAMPAIGN_INFO_VALIDATION_ERROR';

  constructor(message: string, details?: any) {
    super(message);
    this.details = details;
  }
}

export class UnauthorizedToEditError extends UnauthorizedError {
  readonly code = 'UNAUTHORIZED_TO_EDIT';

  constructor() {
    super('You are not authorized to edit this campaign info');
  }
}
