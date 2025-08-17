import { randomUUID } from 'crypto';
import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/dependency-injection';

import { DashboardSocials } from '@/domain/dashboard-socials/entity/dashboard-socials.entity';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';
import { DashboardApprovalRepository } from '@/infrastructure/repositories/dashboard-approval.repository';
import { DashboardSocialsRepository } from '@/infrastructure/repositories/dashboard-socials.repository';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import {
  CreateDashboardSocialsDto,
  ReviewDashboardSocialsDto,
  UpdateDashboardSocialsDto,
} from '@/types/dashboard-socials';

@injectable()
export class DashboardSocialsService {
  constructor(
    @inject(DashboardSocialsRepository)
    private readonly repository: DashboardSocialsRepository,
    @inject(DashboardApprovalRepository)
    private readonly approvalRepository: DashboardApprovalRepository,
    @inject(TOKENS.CampaignRepositoryToken)
    private readonly campaignRepository: CampaignRepository,
    @inject(LoggerService) private readonly logger: LoggerService
  ) {}

  /**
   * Create new dashboard socials
   */
  async create(
    dto: CreateDashboardSocialsDto,
    userId: string
  ): Promise<Result<DashboardSocials, Error>> {
    try {
      this.logger.info('Creating dashboard socials', {
        campaignId: dto.campaignId,
        userId,
      });

      // Check if socials already exist for this campaign
      const existingResult = await this.repository.findByCampaignIdWithApproval(
        dto.campaignId
      );
      if (existingResult.isErr()) {
        return Err(existingResult.unwrapErr());
      }

      const existing = existingResult.unwrap();
      if (existing) {
        return Err(
          new Error('Dashboard socials already exist for this campaign')
        );
      }

      // Create the business entity
      const socialsId = randomUUID();
      const createProps: any = {
        id: socialsId,
        campaignId: dto.campaignId,
      };

      if (dto.linkedIn) createProps.linkedIn = dto.linkedIn;
      if (dto.twitter) createProps.twitter = dto.twitter;
      if (dto.instagram) createProps.instagram = dto.instagram;
      if (dto.facebook) createProps.facebook = dto.facebook;
      if (dto.tiktok) createProps.tiktok = dto.tiktok;
      if (dto.yelp) createProps.yelp = dto.yelp;

      const socials = DashboardSocials.create(createProps);

      if (socials.isErr()) {
        return Err(socials.unwrapErr());
      }

      // Save to business table
      const saveResult = await this.repository.save(socials.unwrap());
      if (saveResult.isErr()) {
        return Err(saveResult.unwrapErr());
      }

      this.logger.info('Dashboard socials created successfully', {
        id: socialsId,
        campaignId: dto.campaignId,
      });

      return Ok(saveResult.unwrap());
    } catch (error) {
      this.logger.error('Error creating dashboard socials', error as Error);
      return Err(
        new Error(
          `Failed to create dashboard socials: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Update existing dashboard socials
   */
  async update(
    id: string,
    dto: UpdateDashboardSocialsDto,
    userId: string
  ): Promise<Result<DashboardSocials, Error>> {
    try {
      this.logger.info('Updating dashboard socials', { id, userId });

      // Find the existing socials with approval data
      const findResult = await this.repository.findByIdWithApproval(id);
      if (findResult.isErr()) {
        return Err(findResult.unwrapErr());
      }

      const socials = findResult.unwrap();
      if (!socials) {
        return Err(new Error('Dashboard socials not found'));
      }

      // Check if user can edit (not already approved)
      if (socials.status === ApprovalStatus.APPROVED) {
        return Err(new Error('Cannot edit approved dashboard socials'));
      }

      // Update the socials
      const updateResult = socials.update(dto);
      if (updateResult.isErr()) {
        return Err(updateResult.unwrapErr());
      }

      // Save changes to business table
      const saveResult = await this.repository.update(id, socials);
      if (saveResult.isErr()) {
        return Err(saveResult.unwrapErr());
      }

      this.logger.info('Dashboard socials updated successfully', { id });

      return Ok(saveResult.unwrap());
    } catch (error) {
      this.logger.error('Error updating dashboard socials', error as Error);
      return Err(
        new Error(
          `Failed to update dashboard socials: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Submit dashboard socials for approval
   */
  async submit(
    id: string,
    userId: string
  ): Promise<Result<DashboardSocials, Error>> {
    try {
      this.logger.info('Submitting dashboard socials for approval', {
        id,
        userId,
      });

      // Use the repository method that coordinates with approval table
      const submitResult = await this.repository.submitForApproval(id, userId);
      if (submitResult.isErr()) {
        return Err(submitResult.unwrapErr());
      }

      this.logger.info('Dashboard socials submitted successfully', { id });

      return Ok(submitResult.unwrap());
    } catch (error) {
      this.logger.error('Error submitting dashboard socials', error as Error);
      return Err(
        new Error(
          `Failed to submit dashboard socials: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Review dashboard socials (admin only)
   */
  async review(
    id: string,
    dto: ReviewDashboardSocialsDto
  ): Promise<Result<DashboardSocials, Error>> {
    try {
      this.logger.info('Reviewing dashboard socials', {
        id,
        action: dto.action,
        adminId: dto.adminId,
      });

      // Find existing dashboard socials
      const findResult = await this.repository.findByIdWithApproval(id);
      if (findResult.isErr()) {
        return Err(findResult.unwrapErr());
      }

      const dashboardSocials = findResult.unwrap();
      if (!dashboardSocials) {
        return Err(new Error('Dashboard socials not found'));
      }

      // Check if it's in pending status
      if (dashboardSocials.status !== ApprovalStatus.PENDING) {
        return Err(new Error('Can only review pending dashboard socials'));
      }

      // Review the approval in the approval table
      const reviewResult = await this.approvalRepository.reviewApproval(
        'dashboard-socials',
        id,
        dto.action,
        dto.adminId,
        dto.comment
      );

      if (reviewResult.isErr()) {
        return Err(reviewResult.unwrapErr());
      }

      // Return updated socials with approval data
      const updatedResult = await this.repository.findByIdWithApproval(id);
      if (updatedResult.isErr()) {
        return Err(updatedResult.unwrapErr());
      }

      this.logger.info('Dashboard socials reviewed successfully', {
        id,
        action: dto.action,
      });

      return Ok(updatedResult.unwrap()!);
    } catch (error) {
      this.logger.error('Error reviewing dashboard socials', error as Error);
      return Err(
        new Error(
          `Failed to review dashboard socials: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Get dashboard socials by ID
   */
  async getById(id: string): Promise<Result<DashboardSocials | null, Error>> {
    try {
      this.logger.debug('Getting dashboard socials by ID', { id });

      const result = await this.repository.findByIdWithApproval(id);
      if (result.isErr()) {
        return Err(result.unwrapErr());
      }

      return Ok(result.unwrap());
    } catch (error) {
      this.logger.error('Error getting dashboard socials', error as Error);
      return Err(
        new Error(
          `Failed to get dashboard socials: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Get dashboard socials by campaign ID with fallback to issuers table
   */
  async getByCampaignId(
    campaignId: string
  ): Promise<Result<DashboardSocials | null, Error>> {
    try {
      this.logger.debug(
        'Getting dashboard socials by campaign ID with fallback',
        { campaignId }
      );

      // First, try to get data from dashboard table
      const dashboardResult =
        await this.repository.findByCampaignIdWithApproval(campaignId);
      if (dashboardResult.isErr()) {
        return Err(dashboardResult.unwrapErr());
      }

      const dashboardData = dashboardResult.unwrap();
      if (dashboardData) {
        this.logger.debug('Found dashboard socials data', { campaignId });
        return Ok(dashboardData);
      }

      // Fallback: Get data from campaign and potentially issuers table
      this.logger.debug(
        'No dashboard data found, falling back to campaign and issuers tables',
        { campaignId }
      );

      // Get campaign data to verify it exists
      const campaignResult = await this.campaignRepository.findById(campaignId);
      if (campaignResult.isErr()) {
        return Err(campaignResult.unwrapErr());
      }

      const campaign = campaignResult.unwrap();
      if (!campaign) {
        this.logger.debug('No campaign found', { campaignId });
        return Ok(null);
      }

      // TODO: Implement issuer relationship lookup when available
      // For now, return null instead of a minimal structure to indicate no social data exists
      // This allows the frontend to handle the absence of social media data appropriately
      this.logger.debug(
        'Campaign found but no social media data available yet. Issuer relationship not implemented.',
        { campaignId }
      );

      return Ok(null);
    } catch (error) {
      this.logger.error(
        'Error getting dashboard socials by campaign ID',
        error as Error
      );
      return Err(
        new Error(
          `Failed to get dashboard socials: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Get dashboard socials by campaign slug
   */
  async getByCampaignSlug(
    campaignSlug: string
  ): Promise<Result<DashboardSocials | null, Error>> {
    try {
      this.logger.debug('Getting dashboard socials by campaign slug', {
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
        'Error getting dashboard socials by campaign slug',
        error as Error
      );
      return Err(
        new Error(
          `Failed to get dashboard socials: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Get all dashboard socials submitted by a user
   */
  async getBySubmittedBy(
    userId: string
  ): Promise<Result<DashboardSocials[], Error>> {
    try {
      this.logger.debug('Getting dashboard socials by submitted user', {
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
        'Error getting socials by submitted user',
        error as Error
      );
      return Err(
        new Error(`Failed to get socials: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Get pending socials for admin review
   */
  async getPendingForReview(): Promise<Result<DashboardSocials[], Error>> {
    try {
      this.logger.debug('Getting pending dashboard socials for review');

      // Get pending approvals from approval repository
      const approvalsResult =
        await this.approvalRepository.findPending('dashboard-socials');
      if (approvalsResult.isErr()) {
        return Err(approvalsResult.unwrapErr());
      }

      const approvals = approvalsResult.unwrap();
      const socials: DashboardSocials[] = [];

      // Get business data for each pending approval
      for (const approval of approvals) {
        const socialsResult = await this.repository.findByIdWithApproval(
          approval.entityId
        );
        if (socialsResult.isOk() && socialsResult.unwrap()) {
          socials.push(socialsResult.unwrap()!);
        }
      }

      return Ok(socials);
    } catch (error) {
      this.logger.error(
        'Error getting pending socials for review',
        error as Error
      );
      return Err(
        new Error(`Failed to get pending socials: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Get socials statistics by status
   */
  async getStatistics(): Promise<
    Result<{ pending: number; approved: number; rejected: number }, Error>
  > {
    try {
      this.logger.debug('Getting dashboard socials statistics');

      const result = await this.repository.countByStatusWithApproval();
      if (result.isErr()) {
        return Err(result.unwrapErr());
      }

      return Ok(result.unwrap());
    } catch (error) {
      this.logger.error('Error getting socials statistics', error as Error);
      return Err(
        new Error(`Failed to get statistics: ${(error as Error).message}`)
      );
    }
  }
}
