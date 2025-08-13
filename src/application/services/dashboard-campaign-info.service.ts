import { injectable, inject } from 'tsyringe';
import { Result, Ok, Err } from 'oxide.ts';
import { DashboardCampaignInfo } from '@/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';
import { DashboardCampaignInfoRepository } from '@/infrastructure/repositories/dashboard-campaign-info.repository';
import { DashboardApprovalRepository } from '@/infrastructure/repositories/dashboard-approval.repository';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { randomUUID } from 'crypto';
import {
  CreateDashboardCampaignInfoDto,
  ReviewDashboardCampaignInfoDto,
  UpdateDashboardCampaignInfoDto,
} from '@/types/dashboard-campaign-info';
import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

@injectable()
export class DashboardCampaignInfoService {
  constructor(
    @inject(DashboardCampaignInfoRepository)
    private readonly repository: DashboardCampaignInfoRepository,
    @inject(DashboardApprovalRepository)
    private readonly approvalRepository: DashboardApprovalRepository,
    @inject(LoggerService) private readonly logger: LoggerService
  ) {}

  /**
   * Create new dashboard campaign info
   */
  async create(
    dto: CreateDashboardCampaignInfoDto,
    userId: string
  ): Promise<Result<DashboardCampaignInfo, Error>> {
    try {
      this.logger.info('Creating dashboard campaign info', {
        campaignId: dto.campaignId,
        userId,
      });

      // Check if info already exists for this campaign
      const existingResult = await this.repository.findByCampaignIdWithApproval(dto.campaignId);
      if (existingResult.isErr()) {
        return Err(existingResult.unwrapErr());
      }

      const existing = existingResult.unwrap();
      if (existing) {
        return Err(new Error('Dashboard campaign info already exists for this campaign'));
      }

      // Create the business entity
      const infoId = randomUUID();
      const createProps: any = {
        id: infoId,
        campaignId: dto.campaignId,
      };

      if (dto.milestones) {
        createProps.milestones = dto.milestones;
      }
      if (dto.investorPitch) {
        createProps.investorPitch = dto.investorPitch;
      }
      if (dto.isShowPitch !== undefined) {
        createProps.isShowPitch = dto.isShowPitch;
      }
      if (dto.investorPitchTitle) {
        createProps.investorPitchTitle = dto.investorPitchTitle;
      }

      const info = DashboardCampaignInfo.create(createProps);

      if (info.isErr()) {
        return Err(info.unwrapErr());
      }

      // Save to business table
      const saveResult = await this.repository.save(info.unwrap());
      if (saveResult.isErr()) {
        return Err(saveResult.unwrapErr());
      }

      this.logger.info('Dashboard campaign info created successfully', {
        id: infoId,
        campaignId: dto.campaignId,
      });

      return Ok(saveResult.unwrap());
    } catch (error) {
      this.logger.error('Error creating dashboard campaign info', error as Error);
      return Err(
        new Error(`Failed to create dashboard campaign info: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Update existing dashboard campaign info
   */
  async update(
    id: string,
    dto: UpdateDashboardCampaignInfoDto,
    userId: string
  ): Promise<Result<DashboardCampaignInfo, Error>> {
    try {
      this.logger.info('Updating dashboard campaign info', { id, userId });

      // Find the existing info with approval data
      const findResult = await this.repository.findByIdWithApproval(id);
      if (findResult.isErr()) {
        return Err(findResult.unwrapErr());
      }

      const info = findResult.unwrap();
      if (!info) {
        return Err(new Error('Dashboard campaign info not found'));
      }

      // Check if user can edit (not already approved)
      if (info.status === ApprovalStatus.APPROVED) {
        return Err(new Error('Cannot edit approved dashboard campaign info'));
      }

      // Update the info
      const updateResult = info.update(dto);
      if (updateResult.isErr()) {
        return Err(updateResult.unwrapErr());
      }

      // Save changes to business table
      const saveResult = await this.repository.update(id, info);
      if (saveResult.isErr()) {
        return Err(saveResult.unwrapErr());
      }

      this.logger.info('Dashboard campaign info updated successfully', { id });

      return Ok(saveResult.unwrap());
    } catch (error) {
      this.logger.error('Error updating dashboard campaign info', error as Error);
      return Err(
        new Error(`Failed to update dashboard campaign info: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Submit dashboard campaign info for approval
   */
  async submit(
    id: string,
    userId: string
  ): Promise<Result<DashboardCampaignInfo, Error>> {
    try {
      this.logger.info('Submitting dashboard campaign info for approval', { id, userId });

      // Use the repository method that coordinates with approval table
      const submitResult = await this.repository.submitForApproval(id, userId);
      if (submitResult.isErr()) {
        return Err(submitResult.unwrapErr());
      }

      this.logger.info('Dashboard campaign info submitted successfully', { id });

      return Ok(submitResult.unwrap());
    } catch (error) {
      this.logger.error('Error submitting dashboard campaign info', error as Error);
      return Err(
        new Error(`Failed to submit dashboard campaign info: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Review dashboard campaign info (admin only)
   */
  async review(
    id: string,
    dto: ReviewDashboardCampaignInfoDto
  ): Promise<Result<DashboardCampaignInfo, Error>> {
    try {
      this.logger.info('Reviewing dashboard campaign info', {
        id,
        action: dto.action,
        adminId: dto.adminId,
      });

      // Find existing dashboard campaign info
      const findResult = await this.repository.findByIdWithApproval(id);
      if (findResult.isErr()) {
        return Err(findResult.unwrapErr());
      }

      const dashboardInfo = findResult.unwrap();
      if (!dashboardInfo) {
        return Err(new Error('Dashboard campaign info not found'));
      }

      // Check if it's in pending status
      if (dashboardInfo.status !== ApprovalStatus.PENDING) {
        return Err(new Error('Can only review pending dashboard campaign infos'));
      }

      // Review the approval in the approval table
      const reviewResult = await this.approvalRepository.reviewApproval(
        'dashboard-campaign-info',
        id,
        dto.action,
        dto.adminId,
        dto.comment
      );

      if (reviewResult.isErr()) {
        return Err(reviewResult.unwrapErr());
      }

      // If approved, move data to campaignInfos table
      if (dto.action === 'approve') {
        const moveResult =
          await this.repository.moveToApprovedTable(dashboardInfo);
        if (moveResult.isErr()) {
          this.logger.error(
            'Failed to move approved data to campaignInfos table',
            moveResult.unwrapErr()
          );
          // Don't fail the whole operation, just log the error
        }
      }

      // Return updated info with approval data
      const updatedResult = await this.repository.findByIdWithApproval(id);
      if (updatedResult.isErr()) {
        return Err(updatedResult.unwrapErr());
      }

      this.logger.info('Dashboard campaign info reviewed successfully', {
        id,
        action: dto.action,
      });

      return Ok(updatedResult.unwrap()!);
    } catch (error) {
      this.logger.error('Error reviewing dashboard campaign info', error as Error);
      return Err(
        new Error(`Failed to review dashboard campaign info: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Get dashboard campaign info by ID
   */
  async getById(
    id: string
  ): Promise<Result<DashboardCampaignInfo | null, Error>> {
    try {
      this.logger.debug('Getting dashboard campaign info by ID', { id });

      const result = await this.repository.findByIdWithApproval(id);
      if (result.isErr()) {
        return Err(result.unwrapErr());
      }

      return Ok(result.unwrap());
    } catch (error) {
      this.logger.error('Error getting dashboard campaign info', error as Error);
      return Err(
        new Error(`Failed to get dashboard campaign info: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Get dashboard campaign info by campaign ID
   */
  async getByCampaignId(
    campaignId: string
  ): Promise<Result<DashboardCampaignInfo | null, Error>> {
    try {
      this.logger.debug('Getting dashboard campaign info by campaign ID', { campaignId });

      const result = await this.repository.findByCampaignIdWithApproval(campaignId);
      if (result.isErr()) {
        return Err(result.unwrapErr());
      }

      return Ok(result.unwrap());
    } catch (error) {
      this.logger.error('Error getting dashboard campaign info by campaign ID', error as Error);
      return Err(
        new Error(`Failed to get dashboard campaign info: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Get all dashboard campaign infos submitted by a user
   */
  async getBySubmittedBy(
    userId: string
  ): Promise<Result<DashboardCampaignInfo[], Error>> {
    try {
      this.logger.debug('Getting dashboard campaign infos by submitted user', { userId });

      const result = await this.repository.findBySubmittedByWithApproval(userId);
      if (result.isErr()) {
        return Err(result.unwrapErr());
      }

      return Ok(result.unwrap());
    } catch (error) {
      this.logger.error('Error getting infos by submitted user', error as Error);
      return Err(
        new Error(`Failed to get infos: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Get pending infos for admin review
   */
  async getPendingForReview(): Promise<Result<DashboardCampaignInfo[], Error>> {
    try {
      this.logger.debug('Getting pending dashboard campaign infos for review');

      // Get pending approvals from approval repository
      const approvalsResult = await this.approvalRepository.findPending('dashboard-campaign-info');
      if (approvalsResult.isErr()) {
        return Err(approvalsResult.unwrapErr());
      }

      const approvals = approvalsResult.unwrap();
      const infos: DashboardCampaignInfo[] = [];

      // Get business data for each pending approval
      for (const approval of approvals) {
        const infoResult = await this.repository.findByIdWithApproval(approval.entityId);
        if (infoResult.isOk() && infoResult.unwrap()) {
          infos.push(infoResult.unwrap()!);
        }
      }

      return Ok(infos);
    } catch (error) {
      this.logger.error('Error getting pending infos for review', error as Error);
      return Err(
        new Error(`Failed to get pending infos: ${(error as Error).message}`)
      );
    }
  }
}
