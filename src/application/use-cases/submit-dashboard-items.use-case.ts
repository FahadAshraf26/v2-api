import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/dependency-injection';

import { Submission } from '@/domain/submission/entity/submission.entity';
import { ISubmissionRepository } from '@/domain/submission/repositories/submission.repository.interface';

import { UseCase } from '@/application/core/use-case';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';
import { DashboardCampaignInfoRepository } from '@/infrastructure/repositories/dashboard-campaign-info.repository';
import { DashboardCampaignSummaryRepository } from '@/infrastructure/repositories/dashboard-campaign-summary.repository';
import { DashboardSocialsRepository } from '@/infrastructure/repositories/dashboard-socials.repository';

// Request/Response DTOs (Application Layer concerns)
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
  status: 'completed' | 'partial' | 'failed';
  processedItems: {
    dashboardCampaignInfo?: {
      success: boolean;
      entityId?: string;
      error?: string;
    };
    dashboardCampaignSummary?: {
      success: boolean;
      entityId?: string;
      error?: string;
    };
    dashboardSocials?: { success: boolean; entityId?: string; error?: string };
  };
  successfulItems: string[];
  totalRequested: number;
  totalSuccessful: number;
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
    @inject(TOKENS.DashboardCampaignInfoRepositoryToken)
    private readonly dashboardInfoRepository: DashboardCampaignInfoRepository,
    @inject(DashboardCampaignSummaryRepository)
    private readonly dashboardSummaryRepository: DashboardCampaignSummaryRepository,
    @inject(DashboardSocialsRepository)
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
      // 1. Application-level validation
      const validationResult = await this.validate(request);
      if (validationResult.isErr()) {
        return Err(validationResult.unwrapErr());
      }

      // 2. Create domain entity (business rules enforced here)
      const submissionResult = Submission.create({
        campaignId: request.campaignId,
        submittedBy: request.submittedBy,
        submissionNote: request.submissionNote,
        items: request.items,
      });

      if (submissionResult.isErr()) {
        return Err(submissionResult.unwrapErr());
      }

      const submission = submissionResult.unwrap();

      // 3. Save the submission (persistence)
      const saveResult = await this.submissionRepository.save(submission);
      if (saveResult.isErr()) {
        return Err(saveResult.unwrapErr());
      }

      // 4. Start processing (domain operation)
      const startResult = submission.startProcessing();
      if (startResult.isErr()) {
        return Err(startResult.unwrapErr());
      }

      // 5. Process each selected item (orchestration logic)
      await this.processSelectedItems(submission, request.items);

      // 6. Complete the submission (domain operation)
      const completeResult = submission.complete();
      if (completeResult.isErr()) {
        // If completion fails, mark as failed
        submission.fail('Failed to complete submission');
      }

      // 7. Update submission state
      const updateResult = await this.submissionRepository.update(submission);
      if (updateResult.isErr()) {
        this.logger.error('Failed to update submission', {
          error: updateResult.unwrapErr(),
        });
      }

      // 8. Prepare response
      const response = this.buildResponse(submission);

      this.logger.info('Submit dashboard items use case completed', {
        submissionId: submission.id,
        status: response.status,
        successfulItems: response.successfulItems.length,
      });

      return Ok(response);
    } catch (error) {
      this.logger.error(
        'Submit dashboard items use case failed',
        error as Error
      );
      return Err(
        new Error(`Use case execution failed: ${(error as Error).message}`)
      );
    }
  }

  protected override async validate(
    request: SubmitDashboardItemsRequest
  ): Promise<Result<void, Error>> {
    // Business validation
    if (!request.campaignId?.trim()) {
      return Err(new Error('Campaign ID is required'));
    }

    if (!request.submittedBy?.trim()) {
      return Err(new Error('Submitter ID is required'));
    }

    // Check if campaign exists (external dependency validation)
    const campaignResult = await this.campaignRepository.findById(
      request.campaignId
    );
    if (campaignResult.isErr()) {
      return Err(campaignResult.unwrapErr());
    }

    if (!campaignResult.unwrap()) {
      return Err(new Error('Campaign not found'));
    }

    return Ok(undefined);
  }

  // Private orchestration methods
  private async processSelectedItems(
    submission: Submission,
    requestedItems: SubmitDashboardItemsRequest['items']
  ): Promise<void> {
    // Process dashboard campaign info
    if (requestedItems.dashboardCampaignInfo) {
      const result = await this.processDashboardInfo(
        submission.campaignId,
        submission.submittedBy
      );
      const recordResult = submission.recordItemResult(
        'dashboardCampaignInfo',
        result
      );
      if (recordResult.isErr()) {
        this.logger.warn('Failed to record dashboard info result', {
          error: recordResult.unwrapErr(),
        });
      }
    }

    // Process dashboard campaign summary
    if (requestedItems.dashboardCampaignSummary) {
      const result = await this.processDashboardSummary(
        submission.campaignId,
        submission.submittedBy
      );
      const recordResult = submission.recordItemResult(
        'dashboardCampaignSummary',
        result
      );
      if (recordResult.isErr()) {
        this.logger.warn('Failed to record dashboard summary result', {
          error: recordResult.unwrapErr(),
        });
      }
    }

    // Process dashboard socials
    if (requestedItems.dashboardSocials) {
      const result = await this.processDashboardSocials(
        submission.campaignId,
        submission.submittedBy
      );
      const recordResult = submission.recordItemResult(
        'dashboardSocials',
        result
      );
      if (recordResult.isErr()) {
        this.logger.warn('Failed to record dashboard socials result', {
          error: recordResult.unwrapErr(),
        });
      }
    }
  }

  private async processDashboardInfo(
    campaignId: string,
    userId: string
  ): Promise<{ success: boolean; entityId?: string; error?: string }> {
    try {
      const findResult =
        await this.dashboardInfoRepository.findByCampaignIdWithApproval(
          campaignId
        );
      if (findResult.isErr()) {
        return { success: false, error: findResult.unwrapErr().message };
      }

      const dashboardInfo = findResult.unwrap();
      if (!dashboardInfo) {
        return { success: false, error: 'Dashboard campaign info not found' };
      }

      const submitResult = await this.dashboardInfoRepository.submitForApproval(
        dashboardInfo.id,
        userId
      );
      if (submitResult.isErr()) {
        return { success: false, error: submitResult.unwrapErr().message };
      }

      return { success: true, entityId: dashboardInfo.id };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async processDashboardSummary(
    campaignId: string,
    userId: string
  ): Promise<{ success: boolean; entityId?: string; error?: string }> {
    try {
      const findResult =
        await this.dashboardSummaryRepository.findByCampaignIdWithApproval(
          campaignId
        );
      if (findResult.isErr()) {
        return { success: false, error: findResult.unwrapErr().message };
      }

      const dashboardSummary = findResult.unwrap();
      if (!dashboardSummary) {
        return {
          success: false,
          error: 'Dashboard campaign summary not found',
        };
      }

      const submitResult =
        await this.dashboardSummaryRepository.submitForApproval(
          dashboardSummary.id,
          userId
        );
      if (submitResult.isErr()) {
        return { success: false, error: submitResult.unwrapErr().message };
      }

      return { success: true, entityId: dashboardSummary.id };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private async processDashboardSocials(
    campaignId: string,
    userId: string
  ): Promise<{ success: boolean; entityId?: string; error?: string }> {
    try {
      const findResult =
        await this.dashboardSocialsRepository.findByCampaignIdWithApproval(
          campaignId
        );
      if (findResult.isErr()) {
        return { success: false, error: findResult.unwrapErr().message };
      }

      const dashboardSocials = findResult.unwrap();
      if (!dashboardSocials) {
        return { success: false, error: 'Dashboard socials not found' };
      }

      const submitResult =
        await this.dashboardSocialsRepository.submitForApproval(
          dashboardSocials.id,
          userId
        );
      if (submitResult.isErr()) {
        return { success: false, error: submitResult.unwrapErr().message };
      }

      return { success: true, entityId: dashboardSocials.id };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  private buildResponse(submission: Submission): SubmitDashboardItemsResponse {
    const successfulItems = submission.getSuccessfulItems();
    const requestedItems = submission.items.getSelectedItems();
    const results = submission.results;

    let status: 'completed' | 'partial' | 'failed';
    if (successfulItems.length === 0) {
      status = 'failed';
    } else if (successfulItems.length === requestedItems.length) {
      status = 'completed';
    } else {
      status = 'partial';
    }

    return {
      submissionId: submission.id,
      status,
      processedItems: results,
      successfulItems,
      totalRequested: requestedItems.length,
      totalSuccessful: successfulItems.length,
    };
  }
}
