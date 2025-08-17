import { randomUUID } from 'crypto';
import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/dependency-injection';

import { DashboardCampaignInfo } from '@/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { CampaignInfoRepository } from '@/infrastructure/repositories/campaign-info.repository';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';
import { DashboardApprovalRepository } from '@/infrastructure/repositories/dashboard-approval.repository';
import { DashboardCampaignInfoRepository } from '@/infrastructure/repositories/dashboard-campaign-info.repository';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

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
    @inject(DashboardApprovalRepository)
    private readonly approvalRepository: DashboardApprovalRepository,
    @inject(TOKENS.CampaignInfoRepositoryToken)
    private readonly campaignInfoRepository: CampaignInfoRepository,
    @inject(TOKENS.CampaignRepositoryToken)
    private readonly campaignRepository: CampaignRepository,
    @inject(LoggerService) private readonly logger: LoggerService
  ) {}

  /**
   * Convert milestones from array to JSON string for storage
   */
  private convertMilestonesToString(
    milestones: string[] | string | undefined
  ): string | undefined {
    if (!milestones) return undefined;
    if (typeof milestones === 'string') return milestones; // backward compatibility
    if (Array.isArray(milestones)) return JSON.stringify(milestones);
    return undefined;
  }

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
      const existingResult = await this.repository.findByCampaignIdWithApproval(
        dto.campaignId
      );
      if (existingResult.isErr()) {
        return Err(existingResult.unwrapErr());
      }

      const existing = existingResult.unwrap();
      if (existing) {
        return Err(
          new Error('Dashboard campaign info already exists for this campaign')
        );
      }

      // Create the business entity
      const infoId = randomUUID();
      const createProps: any = {
        id: infoId,
        campaignId: dto.campaignId,
      };

      if (dto.milestones) {
        createProps.milestones = this.convertMilestonesToString(dto.milestones);
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

      // Convert milestones if provided and prepare update data
      const updateData: {
        milestones?: string;
        investorPitch?: string;
        isShowPitch?: boolean;
        investorPitchTitle?: string;
      } = {};

      if (dto.milestones !== undefined) {
        const convertedMilestones = this.convertMilestonesToString(
          dto.milestones
        );
        if (convertedMilestones !== undefined) {
          updateData.milestones = convertedMilestones;
        }
      }
      if (dto.investorPitch !== undefined) {
        updateData.investorPitch = dto.investorPitch;
      }
      if (dto.isShowPitch !== undefined) {
        updateData.isShowPitch = dto.isShowPitch;
      }
      if (dto.investorPitchTitle !== undefined) {
        updateData.investorPitchTitle = dto.investorPitchTitle;
      }

      // Update the info
      const updateResult = info.update(updateData);
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
   * Submit dashboard campaign info for approval
   */
  async submit(
    id: string,
    userId: string
  ): Promise<Result<DashboardCampaignInfo, Error>> {
    try {
      this.logger.info('Submitting dashboard campaign info for approval', {
        id,
        userId,
      });

      // Use the repository method that coordinates with approval table
      const submitResult = await this.repository.submitForApproval(id, userId);
      if (submitResult.isErr()) {
        return Err(submitResult.unwrapErr());
      }

      this.logger.info('Dashboard campaign info submitted successfully', {
        id,
      });

      return Ok(submitResult.unwrap());
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
        return Err(
          new Error('Can only review pending dashboard campaign infos')
        );
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
      this.logger.debug('Getting dashboard campaign info by ID', { id });

      const result = await this.repository.findByIdWithApproval(id);
      if (result.isErr()) {
        return Err(result.unwrapErr());
      }

      return Ok(result.unwrap());
    } catch (error) {
      this.logger.error(
        'Error getting dashboard campaign info',
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
   * Get dashboard campaign info by campaign ID with fallback to main campaign tables
   */
  async getByCampaignId(
    campaignId: string
  ): Promise<Result<DashboardCampaignInfo | null, Error>> {
    try {
      this.logger.debug(
        'Getting dashboard campaign info by campaign ID with fallback',
        {
          campaignId,
        }
      );

      // First, try to get data from dashboard table
      const dashboardResult =
        await this.repository.findByCampaignIdWithApproval(campaignId);
      if (dashboardResult.isErr()) {
        return Err(dashboardResult.unwrapErr());
      }

      const dashboardData = dashboardResult.unwrap();
      if (dashboardData) {
        this.logger.debug('Found dashboard campaign info data', { campaignId });
        return Ok(dashboardData);
      }

      // Fallback: Get data from main campaign and campaignInfo tables
      this.logger.debug(
        'No dashboard data found, falling back to main campaign tables',
        { campaignId }
      );

      // Get campaign data
      const campaignResult = await this.campaignRepository.findById(campaignId);
      if (campaignResult.isErr()) {
        return Err(campaignResult.unwrapErr());
      }

      const campaign = campaignResult.unwrap();
      if (!campaign) {
        this.logger.debug('No campaign found', { campaignId });
        return Ok(null);
      }

      // Get campaign info data
      const campaignInfoResult =
        await this.campaignInfoRepository.findByCampaignId(campaignId);
      if (campaignInfoResult.isErr()) {
        return Err(campaignInfoResult.unwrapErr());
      }

      const campaignInfo = campaignInfoResult.unwrap();
      if (!campaignInfo) {
        this.logger.debug(
          'No campaign info found, creating minimal dashboard data structure',
          { campaignId }
        );

        // Create a minimal dashboard structure with campaign basic data
        const props = {
          id: randomUUID(),
          campaignId: campaignId,
          milestones: '',
          investorPitch: '',
          isShowPitch: false,
          investorPitchTitle: '',
          status: ApprovalStatus.PENDING,
          submittedBy: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const dashboardInfo = DashboardCampaignInfo.fromPersistence(props);
        return Ok(dashboardInfo);
      }

      // Map campaignInfo data to dashboard structure
      this.logger.debug('Found campaign info, mapping to dashboard structure', {
        campaignId,
      });
      const props = {
        id: campaignInfo.campaignInfoId,
        campaignId: campaignId,
        milestones: campaignInfo.milestones || '',
        investorPitch: campaignInfo.investorPitch || '',
        isShowPitch: campaignInfo.isShowPitch || false,
        investorPitchTitle: campaignInfo.investorPitchTitle || '',
        status: ApprovalStatus.APPROVED, // Main table data is already approved
        submittedBy: '',
        createdAt: campaignInfo.createdAt,
        updatedAt: campaignInfo.updatedAt,
      };

      const dashboardInfo = DashboardCampaignInfo.fromPersistence(props);
      return Ok(dashboardInfo);
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
   * Get dashboard campaign info by campaign slug
   */
  async getByCampaignSlug(
    campaignSlug: string
  ): Promise<Result<DashboardCampaignInfo | null, Error>> {
    try {
      this.logger.debug('Getting dashboard campaign info by campaign slug', {
        campaignSlug,
      });

      // First, find the campaign by slug to get the campaign ID
      const campaignResult =
        await this.campaignRepository.findBySlug(campaignSlug);
      if (campaignResult.isErr()) {
        return Err(campaignResult.unwrapErr());
      }

      const campaign = campaignResult.unwrap();
      if (!campaign) {
        this.logger.debug('No campaign found with slug', { campaignSlug });
        return Ok(null);
      }

      // Now use the existing getByCampaignId method with the found campaign ID
      const campaignData = campaign.toObject();
      return await this.getByCampaignId(campaignData.campaignId);
    } catch (error) {
      this.logger.error(
        'Error getting dashboard campaign info by campaign slug',
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
   * Get all dashboard campaign infos submitted by a user
   */
  async getBySubmittedBy(
    userId: string
  ): Promise<Result<DashboardCampaignInfo[], Error>> {
    try {
      this.logger.debug('Getting dashboard campaign infos by submitted user', {
        userId,
      });

      const result =
        await this.repository.findBySubmittedByWithApproval(userId);
      if (result.isErr()) {
        return Err(result.unwrapErr());
      }

      return Ok(result.unwrap());
    } catch (error) {
      this.logger.error(
        'Error getting infos by submitted user',
        error as Error
      );
      return Err(new Error(`Failed to get infos: ${(error as Error).message}`));
    }
  }

  /**
   * Get pending infos for admin review
   */
  async getPendingForReview(): Promise<Result<DashboardCampaignInfo[], Error>> {
    try {
      this.logger.debug('Getting pending dashboard campaign infos for review');

      // Get pending approvals from approval repository
      const approvalsResult = await this.approvalRepository.findPending(
        'dashboard-campaign-info'
      );
      if (approvalsResult.isErr()) {
        return Err(approvalsResult.unwrapErr());
      }

      const approvals = approvalsResult.unwrap();
      const infos: DashboardCampaignInfo[] = [];

      // Get business data for each pending approval
      for (const approval of approvals) {
        const infoResult = await this.repository.findByIdWithApproval(
          approval.entityId
        );
        if (infoResult.isOk() && infoResult.unwrap()) {
          infos.push(infoResult.unwrap()!);
        }
      }

      return Ok(infos);
    } catch (error) {
      this.logger.error(
        'Error getting pending infos for review',
        error as Error
      );
      return Err(
        new Error(`Failed to get pending infos: ${(error as Error).message}`)
      );
    }
  }
}
