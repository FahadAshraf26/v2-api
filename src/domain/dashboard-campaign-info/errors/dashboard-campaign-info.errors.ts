import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
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
    super(`Dashboard campaign info already exists for campaign ${campaignId}`);
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

  constructor(userId: string, infoId: string) {
    super(
      `User ${userId} is not authorized to edit dashboard campaign info ${infoId}`
    );
  }
}
