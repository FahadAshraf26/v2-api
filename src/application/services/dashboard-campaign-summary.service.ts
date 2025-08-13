import { injectable, inject } from 'tsyringe';
import { Result, Ok, Err } from 'oxide.ts';
import { DashboardCampaignSummary } from '@/domain/dashboard-campaign-summary/entity/dashboard-campaign-summary.entity';
import { DashboardCampaignSummaryRepository } from '@/infrastructure/repositories/dashboard-campaign-summary.repository';
import { DashboardApprovalRepository } from '@/infrastructure/repositories/dashboard-approval.repository';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { randomUUID } from 'crypto';
import {
  CreateDashboardCampaignSummaryDto,
  ReviewDashboardCampaignSummaryDto,
  UpdateDashboardCampaignSummaryDto,
} from '@/types/dashboard-campaign-summary';
import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

@injectable()
export class DashboardCampaignSummaryService {
  constructor(
    @inject(DashboardCampaignSummaryRepository)
    private readonly repository: DashboardCampaignSummaryRepository,
    @inject(DashboardApprovalRepository)
    private readonly approvalRepository: DashboardApprovalRepository,
    @inject(LoggerService) private readonly logger: LoggerService
  ) {}

  /**
   * Create new dashboard campaign summary
   */
  async create(
    dto: CreateDashboardCampaignSummaryDto,
    userId: string
  ): Promise<Result<DashboardCampaignSummary, Error>> {
    try {
      this.logger.info('Creating dashboard campaign summary', {
        campaignId: dto.campaignId,
        userId,
      });

      // Check if a summary already exists for this campaign
      const existingResult = await this.repository.findByCampaignIdWithApproval(dto.campaignId);
      if (existingResult.isErr()) {
        return Err(existingResult.unwrapErr());
      }

      const existing = existingResult.unwrap();
      if (existing) {
        return Err(new Error('Dashboard campaign summary already exists for this campaign'));
      }

      // Create the business entity
      const summaryId = randomUUID();
      const createProps: any = {
        id: summaryId,
        campaignId: dto.campaignId,
      };

      if (dto.summary) {
        createProps.summary = dto.summary;
      }
      if (dto.tagLine) {
        createProps.tagLine = dto.tagLine;
      }

      const summary = DashboardCampaignSummary.create(createProps);

      if (summary.isErr()) {
        return Err(summary.unwrapErr());
      }

      // Save to business table
      const saveResult = await this.repository.save(summary.unwrap());
      if (saveResult.isErr()) {
        return Err(saveResult.unwrapErr());
      }

      this.logger.info('Dashboard campaign summary created successfully', {
        id: summaryId,
        campaignId: dto.campaignId,
      });

      return Ok(saveResult.unwrap());
    } catch (error) {
      this.logger.error('Error creating dashboard campaign summary', error as Error);
      return Err(
        new Error(`Failed to create dashboard campaign summary: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Update existing dashboard campaign summary
   */
  async update(
    id: string,
    dto: UpdateDashboardCampaignSummaryDto,
    userId: string
  ): Promise<Result<DashboardCampaignSummary, Error>> {
    try {
      this.logger.info('Updating dashboard campaign summary', {
        id,
        userId,
      });

      // Find the existing summary with approval data
      const findResult = await this.repository.findByIdWithApproval(id);
      if (findResult.isErr()) {
        return Err(findResult.unwrapErr());
      }

      const summary = findResult.unwrap();
      if (!summary) {
        return Err(new Error('Dashboard campaign summary not found'));
      }

      // Check if user can edit (not already approved)
      if (summary.status === ApprovalStatus.APPROVED) {
        return Err(new Error('Cannot edit approved dashboard campaign summary'));
      }

      // Update the summary
      const updateResult = summary.update(dto);
      if (updateResult.isErr()) {
        return Err(updateResult.unwrapErr());
      }

      // Save changes to business table
      const saveResult = await this.repository.update(id, summary);
      if (saveResult.isErr()) {
        return Err(saveResult.unwrapErr());
      }

      this.logger.info('Dashboard campaign summary updated successfully', {
        id,
      });

      return Ok(saveResult.unwrap());
    } catch (error) {
      this.logger.error('Error updating dashboard campaign summary', error as Error);
      return Err(
        new Error(`Failed to update dashboard campaign summary: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Submit dashboard campaign summary for approval
   */
  async submit(
    id: string,
    userId: string
  ): Promise<Result<DashboardCampaignSummary, Error>> {
    try {
      this.logger.info('Submitting dashboard campaign summary for approval', {
        id,
        userId,
      });

      // Use the repository method that coordinates with approval table
      const submitResult = await this.repository.submitForApproval(id, userId);
      if (submitResult.isErr()) {
        return Err(submitResult.unwrapErr());
      }

      this.logger.info('Dashboard campaign summary submitted successfully', {
        id,
      });

      return Ok(submitResult.unwrap());
    } catch (error) {
      this.logger.error('Error submitting dashboard campaign summary', error as Error);
      return Err(
        new Error(`Failed to submit dashboard campaign summary: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Review dashboard campaign summary (admin only)
   */
  async review(
    id: string,
    dto: ReviewDashboardCampaignSummaryDto
  ): Promise<Result<DashboardCampaignSummary, Error>> {
    try {
      this.logger.info('Reviewing dashboard campaign summary', {
        id,
        action: dto.action,
        adminId: dto.adminId,
      });

      // Find existing dashboard campaign summary
      const findResult = await this.repository.findByIdWithApproval(id);
      if (findResult.isErr()) {
        return Err(findResult.unwrapErr());
      }

      const dashboardSummary = findResult.unwrap();
      if (!dashboardSummary) {
        return Err(new Error('Dashboard campaign summary not found'));
      }

      // Check if it's in pending status
      if (dashboardSummary.status !== ApprovalStatus.PENDING) {
        return Err(new Error('Can only review pending dashboard campaign summaries'));
      }

      // Review the approval in the approval table
      const reviewResult = await this.approvalRepository.reviewApproval(
        'dashboard-campaign-summary',
        id,
        dto.action,
        dto.adminId,
        dto.comment
      );

      if (reviewResult.isErr()) {
        return Err(reviewResult.unwrapErr());
      }

      // Return updated summary with approval data
      const updatedResult = await this.repository.findByIdWithApproval(id);
      if (updatedResult.isErr()) {
        return Err(updatedResult.unwrapErr());
      }

      this.logger.info('Dashboard campaign summary reviewed successfully', {
        id,
        action: dto.action,
      });

      return Ok(updatedResult.unwrap()!);
    } catch (error) {
      this.logger.error('Error reviewing dashboard campaign summary', error as Error);
      return Err(
        new Error(`Failed to review dashboard campaign summary: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Get dashboard campaign summary by ID
   */
  async getById(
    id: string
  ): Promise<Result<DashboardCampaignSummary | null, Error>> {
    try {
      this.logger.debug('Getting dashboard campaign summary by ID', { id });

      const result = await this.repository.findByIdWithApproval(id);
      if (result.isErr()) {
        return Err(result.unwrapErr());
      }

      return Ok(result.unwrap());
    } catch (error) {
      this.logger.error('Error getting dashboard campaign summary', error as Error);
      return Err(
        new Error(`Failed to get dashboard campaign summary: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Get dashboard campaign summary by campaign ID
   */
  async getByCampaignId(
    campaignId: string
  ): Promise<Result<DashboardCampaignSummary | null, Error>> {
    try {
      this.logger.debug('Getting dashboard campaign summary by campaign ID', { campaignId });

      const result = await this.repository.findByCampaignIdWithApproval(campaignId);
      if (result.isErr()) {
        return Err(result.unwrapErr());
      }

      return Ok(result.unwrap());
    } catch (error) {
      this.logger.error('Error getting dashboard campaign summary by campaign ID', error as Error);
      return Err(
        new Error(`Failed to get dashboard campaign summary: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Get all dashboard campaign summaries submitted by a user
   */
  async getBySubmittedBy(
    userId: string
  ): Promise<Result<DashboardCampaignSummary[], Error>> {
    try {
      this.logger.debug('Getting dashboard campaign summaries by submitted user', { userId });

      const result = await this.repository.findBySubmittedByWithApproval(userId);
      if (result.isErr()) {
        return Err(result.unwrapErr());
      }

      return Ok(result.unwrap());
    } catch (error) {
      this.logger.error('Error getting summaries by submitted user', error as Error);
      return Err(
        new Error(`Failed to get summaries: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Get all approved dashboard campaign summaries
   */
  async getApproved(): Promise<Result<DashboardCampaignSummary[], Error>> {
    try {
      this.logger.debug('Getting approved dashboard campaign summaries');

      const result = await this.repository.findApprovedWithApproval();
      if (result.isErr()) {
        return Err(result.unwrapErr());
      }

      return Ok(result.unwrap());
    } catch (error) {
      this.logger.error('Error getting approved summaries', error as Error);
      return Err(
        new Error(`Failed to get approved summaries: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Get pending summaries for admin review
   */
  async getPendingForReview(): Promise<Result<DashboardCampaignSummary[], Error>> {
    try {
      this.logger.debug('Getting pending dashboard campaign summaries for review');

      // Get pending approvals from approval repository
      const approvalsResult = await this.approvalRepository.findPending('dashboard-campaign-summary');
      if (approvalsResult.isErr()) {
        return Err(approvalsResult.unwrapErr());
      }

      const approvals = approvalsResult.unwrap();
      const summaries: DashboardCampaignSummary[] = [];

      // Get business data for each pending approval
      for (const approval of approvals) {
        const summaryResult = await this.repository.findByIdWithApproval(approval.entityId);
        if (summaryResult.isOk() && summaryResult.unwrap()) {
          summaries.push(summaryResult.unwrap()!);
        }
      }

      return Ok(summaries);
    } catch (error) {
      this.logger.error('Error getting pending summaries for review', error as Error);
      return Err(
        new Error(`Failed to get pending summaries: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Get summary statistics by status
   */
  async getStatistics(): Promise<Result<{ pending: number; approved: number; rejected: number }, Error>> {
    try {
      this.logger.debug('Getting dashboard campaign summary statistics');

      const result = await this.repository.countByStatusWithApproval();
      if (result.isErr()) {
        return Err(result.unwrapErr());
      }

      return Ok(result.unwrap());
    } catch (error) {
      this.logger.error('Error getting summary statistics', error as Error);
      return Err(
        new Error(`Failed to get statistics: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Delete dashboard campaign summary (if not approved)
   */
  async delete(
    id: string,
    userId: string
  ): Promise<Result<void, Error>> {
    try {
      this.logger.info('Deleting dashboard campaign summary', { id, userId });

      // Find the summary with approval data
      const findResult = await this.repository.findByIdWithApproval(id);
      if (findResult.isErr()) {
        return Err(findResult.unwrapErr());
      }

      const summary = findResult.unwrap();
      if (!summary) {
        return Err(new Error('Dashboard campaign summary not found'));
      }

      // Check if it can be deleted (not approved)
      if (summary.status === ApprovalStatus.APPROVED) {
        return Err(new Error('Cannot delete approved dashboard campaign summary'));
      }

      // Delete from business table (this should cascade to approval table via FK)
      const deleteResult = await this.repository.delete(id);
      if (deleteResult.isErr()) {
        return Err(deleteResult.unwrapErr());
      }

      this.logger.info('Dashboard campaign summary deleted successfully', { id });

      return Ok(undefined);
    } catch (error) {
      this.logger.error('Error deleting dashboard campaign summary', error as Error);
      return Err(
        new Error(`Failed to delete dashboard campaign summary: ${(error as Error).message}`)
      );
    }
  }
}
