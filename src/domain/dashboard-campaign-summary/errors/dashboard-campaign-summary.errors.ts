import {
  BusinessRuleViolationError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/domain/errors/base-errors';

export class DashboardCampaignSummaryNotFoundError extends NotFoundError {
  readonly code = 'DASHBOARD_CAMPAIGN_SUMMARY_NOT_FOUND';

  constructor(id: string) {
    super(`Dashboard campaign summary with ID ${id} not found`);
  }
}

export class DashboardCampaignSummaryAlreadyExistsError extends ConflictError {
  readonly code = 'DASHBOARD_CAMPAIGN_SUMMARY_ALREADY_EXISTS';

  constructor(campaignId: string) {
    super(
      `Dashboard campaign summary already exists for campaign ${campaignId}`
    );
  }
}

export class DashboardCampaignSummaryAlreadyApprovedError extends BusinessRuleViolationError {
  readonly code = 'DASHBOARD_CAMPAIGN_SUMMARY_ALREADY_APPROVED';

  constructor(id: string) {
    super(
      `Dashboard campaign summary ${id} is already approved and cannot be modified`
    );
  }
}

export class DashboardCampaignSummaryAccessDeniedError extends UnauthorizedError {
  readonly code = 'DASHBOARD_CAMPAIGN_SUMMARY_ACCESS_DENIED';

  constructor(userId: string, summaryId: string) {
    super(
      `User ${userId} does not have permission to modify dashboard campaign summary ${summaryId}`
    );
  }
}

export class DashboardCampaignSummaryValidationError extends ValidationError {
  readonly code = 'DASHBOARD_CAMPAIGN_SUMMARY_VALIDATION_ERROR';

  constructor(field: string, message: string) {
    super(`Validation error for ${field}: ${message}`);
  }
}
