import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/dependency-injection';

import { Submission } from '@/domain/submission/entity/submission.entity';
import { ISubmissionRepository } from '@/domain/submission/repositories/submission.repository.interface';

import { UseCase } from '@/application/core/use-case';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';
import { DashboardApprovalRepository } from '@/infrastructure/repositories/dashboard-approval.repository';
import { DashboardCampaignInfoRepository } from '@/infrastructure/repositories/dashboard-campaign-info.repository';
import { DashboardCampaignSummaryRepository } from '@/infrastructure/repositories/dashboard-campaign-summary.repository';
import { DashboardSocialsRepository } from '@/infrastructure/repositories/dashboard-socials.repository';

import { SubmittedItems } from '@/types/approval';

export interface SubmitDashboardItemsRequest {
  campaignId: string;
  submittedBy: string;
  items: {
    dashboardCampaignInfo?: boolean;
    dashboardCampaignSummary?: boolean;
    dashboardSocials?: boolean;
  };
  submissionNote?: string;
}

export interface SubmitDashboardItemsResponse {
  submissionId: string;
  approvalId: string;
  status: 'completed' | 'failed';
  submittedItems: SubmittedItems;
  errors?: string[];
}

@injectable()
export class SubmitDashboardItemsUseCase extends UseCase<
  SubmitDashboardItemsRequest,
  SubmitDashboardItemsResponse
> {
  constructor(
    @inject(LoggerService) private readonly logger: LoggerService,
    @inject(TOKENS.SubmissionRepositoryToken)
    private readonly submissionRepository: ISubmissionRepository,
    @inject(TOKENS.CampaignRepositoryToken)
    private readonly campaignRepository: CampaignRepository,
    @inject(TOKENS.DashboardApprovalRepositoryToken)
    private readonly approvalRepository: DashboardApprovalRepository,
    @inject(TOKENS.DashboardCampaignInfoRepositoryToken)
    private readonly dashboardInfoRepository: DashboardCampaignInfoRepository,
    @inject(TOKENS.DashboardCampaignSummaryRepositoryToken)
    private readonly dashboardSummaryRepository: DashboardCampaignSummaryRepository,
    @inject(TOKENS.DashboardSocialsRepositoryToken)
    private readonly dashboardSocialsRepository: DashboardSocialsRepository
  ) {
    super();
  }

  async execute(
    request: SubmitDashboardItemsRequest
  ): Promise<Result<SubmitDashboardItemsResponse, Error>> {
    this.logger.info('Executing submit dashboard items use case', {
      campaignId: request.campaignId,
      submittedBy: request.submittedBy,
      items: request.items,
    });

    try {
      // 1. Validate campaign exists
      const campaignValidation = await this.validateCampaignExists(
        request.campaignId
      );
      if (campaignValidation.isErr()) {
        return Err(campaignValidation.unwrapErr());
      }

      // 2. Check for existing pending reviews
      const pendingCheckResult = await this.checkPendingReviews(
        request.campaignId
      );
      if (pendingCheckResult.isErr()) {
        return Err(pendingCheckResult.unwrapErr());
      }

      // 3. Validate that requested entities exist and have content
      const validationResult = await this.validateEntitiesExist(
        request.campaignId,
        request.items
      );
      if (validationResult.isErr()) {
        return Err(validationResult.unwrapErr());
      }

      // 4. Create submission entity for tracking
      const submissionResult = Submission.create({
        campaignId: request.campaignId,
        submittedBy: request.submittedBy,
        items: request.items,
        submissionNote: request.submissionNote,
      });

      if (submissionResult.isErr()) {
        return Err(submissionResult.unwrapErr());
      }

      const submission = submissionResult.unwrap();

      // 5. Submit for approval (single entry per campaign)
      const submittedItems: SubmittedItems = {
        dashboardCampaignInfo: !!request.items.dashboardCampaignInfo,
        dashboardCampaignSummary: !!request.items.dashboardCampaignSummary,
        dashboardSocials: !!request.items.dashboardSocials,
      };

      const approvalResult = await this.approvalRepository.submitForApproval(
        request.campaignId,
        submittedItems,
        request.submittedBy
      );

      if (approvalResult.isErr()) {
        return Err(approvalResult.unwrapErr());
      }

      const approval = approvalResult.unwrap();

      // 6. Save submission for tracking (optional - log warning if fails)
      const saveResult = await this.submissionRepository.save(submission);
      if (saveResult.isErr()) {
        this.logger.warn('Failed to save submission entity', {
          error: saveResult.unwrapErr().message,
        });
      }

      // 7. Build response
      const response: SubmitDashboardItemsResponse = {
        submissionId: submission.id,
        approvalId: approval.id,
        status: 'completed',
        submittedItems: approval.submittedItems,
      };

      this.logger.info(
        'Submit dashboard items use case completed successfully',
        {
          campaignId: request.campaignId,
          approvalId: approval.id,
          submittedItems: approval.submittedItems,
        }
      );

      return Ok(response);
    } catch (error) {
      this.logger.error(
        'Error in submit dashboard items use case',
        error as Error
      );
      return Err(
        new Error(
          `Failed to submit dashboard items: ${(error as Error).message}`
        )
      );
    }
  }

  // Private validation methods
  private async validateCampaignExists(
    campaignId: string
  ): Promise<Result<void, Error>> {
    const campaignResult = await this.campaignRepository.findById(campaignId);
    if (campaignResult.isErr()) {
      return Err(campaignResult.unwrapErr());
    }

    if (!campaignResult.unwrap()) {
      return Err(new Error('Campaign not found'));
    }

    return Ok(undefined);
  }

  private async checkPendingReviews(
    campaignId: string
  ): Promise<Result<void, Error>> {
    this.logger.debug('Checking for existing pending reviews', { campaignId });

    const hasPendingResult =
      await this.approvalRepository.hasPendingApproval(campaignId);
    if (hasPendingResult.isErr()) {
      return Err(hasPendingResult.unwrapErr());
    }

    const hasPending = hasPendingResult.unwrap();
    if (hasPending) {
      return Err(
        new Error(
          'This campaign already has a pending review. ' +
            'Please wait for the current review to complete before submitting again.'
        )
      );
    }

    return Ok(undefined);
  }

  private async validateEntitiesExist(
    campaignId: string,
    requestedItems: SubmitDashboardItemsRequest['items']
  ): Promise<Result<void, Error>> {
    const errors: string[] = [];

    // Check dashboard campaign info if requested
    if (requestedItems.dashboardCampaignInfo) {
      try {
        const infoResult =
          await this.dashboardInfoRepository.findByCampaignIdWithApproval(
            campaignId
          );
        if (infoResult.isErr() || !infoResult.unwrap()) {
          errors.push('Dashboard Campaign Info not found for this campaign');
        } else if (!infoResult.unwrap()!.hasContent()) {
          errors.push('Dashboard Campaign Info has no content to submit');
        }
      } catch (error) {
        errors.push(
          `Failed to validate Dashboard Campaign Info: ${(error as Error).message}`
        );
      }
    }

    // Check dashboard campaign summary if requested
    if (requestedItems.dashboardCampaignSummary) {
      try {
        const summaryResult =
          await this.dashboardSummaryRepository.findByCampaignIdWithApproval(
            campaignId
          );
        if (summaryResult.isErr() || !summaryResult.unwrap()) {
          errors.push('Dashboard Campaign Summary not found for this campaign');
        } else if (!summaryResult.unwrap()!.hasContent()) {
          errors.push('Dashboard Campaign Summary has no content to submit');
        }
      } catch (error) {
        errors.push(
          `Failed to validate Dashboard Campaign Summary: ${(error as Error).message}`
        );
      }
    }

    // Check dashboard socials if requested
    if (requestedItems.dashboardSocials) {
      try {
        const socialsResult =
          await this.dashboardSocialsRepository.findByCampaignIdWithApproval(
            campaignId
          );
        if (socialsResult.isErr() || !socialsResult.unwrap()) {
          errors.push('Dashboard Socials not found for this campaign');
        } else if (!socialsResult.unwrap()!.hasContent()) {
          errors.push('Dashboard Socials has no content to submit');
        }
      } catch (error) {
        errors.push(
          `Failed to validate Dashboard Socials: ${(error as Error).message}`
        );
      }
    }

    if (errors.length > 0) {
      return Err(new Error(errors.join('; ')));
    }

    return Ok(undefined);
  }
}
