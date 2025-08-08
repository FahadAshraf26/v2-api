import { injectable, inject } from 'tsyringe';
import { Result, Ok, Err } from 'oxide.ts';
import { DashboardCampaignInfo } from '@/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';
import { DashboardCampaignInfoRepository } from '@/infrastructure/repositories/dashboard-campaign-info.repository';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { randomUUID } from 'crypto';
import {
  CreateDashboardCampaignInfoDto,
  ReviewDashboardCampaignInfoDto,
  UpdateDashboardCampaignInfoDto,
} from '@/types/dashboard-campaign-info';

@injectable()
export class DashboardCampaignInfoService {
  constructor(
    @inject(DashboardCampaignInfoRepository)
    private readonly repository: DashboardCampaignInfoRepository,
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

      // Check if dashboard campaign info already exists for this campaign
      const existingResult = await this.repository.findByCampaignId(
        dto.campaignId
      );
      if (existingResult.isErr()) {
        return Err(existingResult.unwrapErr());
      }

      if (existingResult.unwrap()) {
        return Err(
          new Error('Dashboard campaign info already exists for this campaign')
        );
      }

      // Create new dashboard campaign info
      const createResult = DashboardCampaignInfo.create({
        id: randomUUID(),
        campaignId: dto.campaignId,
        milestones: dto.milestones,
        investorPitch: dto.investorPitch,
        isShowPitch: dto.isShowPitch,
        investorPitchTitle: dto.investorPitchTitle,
        submittedBy: userId, // Set the user who created it
      });

      if (createResult.isErr()) {
        return Err(createResult.unwrapErr());
      }

      const dashboardInfo = createResult.unwrap();

      // Save to repository
      const saveResult = await this.repository.save(dashboardInfo);
      if (saveResult.isErr()) {
        return Err(saveResult.unwrapErr());
      }

      this.logger.info('Dashboard campaign info created successfully', {
        id: dashboardInfo.id,
        campaignId: dto.campaignId,
      });

      return Ok(saveResult.unwrap());
    } catch (error) {
      this.logger.error(
        'Error creating dashboard campaign info',
        error as Error
      );
      return Err(
        new Error(
          `Failed to create dashboard campaign info: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Update dashboard campaign info (only if pending or rejected)
   */
  async update(
    id: string,
    dto: UpdateDashboardCampaignInfoDto,
    userId: string
  ): Promise<Result<DashboardCampaignInfo, Error>> {
    try {
      this.logger.info('Updating dashboard campaign info', { id, userId });

      // Find existing dashboard campaign info
      const findResult = await this.repository.findById(id);
      if (findResult.isErr()) {
        return Err(findResult.unwrapErr());
      }

      const dashboardInfo = findResult.unwrap();
      if (!dashboardInfo) {
        return Err(new Error('Dashboard campaign info not found'));
      }

      // Check if user can edit
      if (!dashboardInfo.canEdit(userId)) {
        return Err(
          new Error(
            'You are not authorized to edit this dashboard campaign info or it has been approved'
          )
        );
      }

      // Update the entity
      const updateResult = dashboardInfo.update(dto);
      if (updateResult.isErr()) {
        return Err(updateResult.unwrapErr());
      }

      // Save changes
      const saveResult = await this.repository.update(id, dashboardInfo);
      if (saveResult.isErr()) {
        return Err(saveResult.unwrapErr());
      }

      this.logger.info('Dashboard campaign info updated successfully', { id });

      return Ok(saveResult.unwrap());
    } catch (error) {
      this.logger.error(
        'Error updating dashboard campaign info',
        error as Error
      );
      return Err(
        new Error(
          `Failed to update dashboard campaign info: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Submit dashboard campaign info for review
   */
  async submit(
    id: string,
    userId: string
  ): Promise<Result<DashboardCampaignInfo, Error>> {
    try {
      this.logger.info('Submitting dashboard campaign info for review', {
        id,
        userId,
      });

      // Find existing dashboard campaign info
      const findResult = await this.repository.findById(id);
      if (findResult.isErr()) {
        return Err(findResult.unwrapErr());
      }

      const dashboardInfo = findResult.unwrap();
      if (!dashboardInfo) {
        return Err(new Error('Dashboard campaign info not found'));
      }

      // Submit for review
      const submitResult = dashboardInfo.submit(userId);
      if (submitResult.isErr()) {
        return Err(submitResult.unwrapErr());
      }

      // Save changes
      const saveResult = await this.repository.update(id, dashboardInfo);
      if (saveResult.isErr()) {
        return Err(saveResult.unwrapErr());
      }

      this.logger.info('Dashboard campaign info submitted for review', { id });

      return Ok(saveResult.unwrap());
    } catch (error) {
      this.logger.error(
        'Error submitting dashboard campaign info',
        error as Error
      );
      return Err(
        new Error(
          `Failed to submit dashboard campaign info: ${(error as Error).message}`
        )
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
      const findResult = await this.repository.findById(id);
      if (findResult.isErr()) {
        return Err(findResult.unwrapErr());
      }

      const dashboardInfo = findResult.unwrap();
      if (!dashboardInfo) {
        return Err(new Error('Dashboard campaign info not found'));
      }

      let reviewResult: Result<void, Error>;

      if (dto.action === 'approve') {
        reviewResult = dashboardInfo.approve(dto.adminId, dto.comment);
      } else {
        if (!dto.comment) {
          return Err(new Error('Comment is required when rejecting'));
        }
        reviewResult = dashboardInfo.reject(dto.adminId, dto.comment);
      }

      if (reviewResult.isErr()) {
        return Err(reviewResult.unwrapErr());
      }

      // Save changes
      const saveResult = await this.repository.update(id, dashboardInfo);
      if (saveResult.isErr()) {
        return Err(saveResult.unwrapErr());
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

      this.logger.info('Dashboard campaign info reviewed successfully', {
        id,
        action: dto.action,
      });

      return Ok(saveResult.unwrap());
    } catch (error) {
      this.logger.error(
        'Error reviewing dashboard campaign info',
        error as Error
      );
      return Err(
        new Error(
          `Failed to review dashboard campaign info: ${(error as Error).message}`
        )
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
      return await this.repository.findById(id);
    } catch (error) {
      this.logger.error(
        'Error getting dashboard campaign info by ID',
        error as Error
      );
      return Err(
        new Error(
          `Failed to get dashboard campaign info: ${(error as Error).message}`
        )
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
      return await this.repository.findByCampaignId(campaignId);
    } catch (error) {
      this.logger.error(
        'Error getting dashboard campaign info by campaign ID',
        error as Error
      );
      return Err(
        new Error(
          `Failed to get dashboard campaign info: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Get all pending dashboard campaign infos for admin review
   */
  async getPendingForReview(): Promise<Result<DashboardCampaignInfo[], Error>> {
    try {
      return await this.repository.findPendingForReview();
    } catch (error) {
      this.logger.error(
        'Error getting pending dashboard campaign infos',
        error as Error
      );
      return Err(
        new Error(`Failed to get pending items: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Get dashboard campaign infos by submitter
   */
  async getBySubmittedBy(
    userId: string
  ): Promise<Result<DashboardCampaignInfo[], Error>> {
    try {
      return await this.repository.findBySubmittedBy(userId);
    } catch (error) {
      this.logger.error(
        'Error getting dashboard campaign infos by submitter',
        error as Error
      );
      return Err(
        new Error(
          `Failed to get items by submitter: ${(error as Error).message}`
        )
      );
    }
  }
}
