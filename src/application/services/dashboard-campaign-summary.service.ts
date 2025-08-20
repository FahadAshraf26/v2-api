import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { DashboardCampaignSummary } from '@/domain/dashboard-campaign-summary/entity/dashboard-campaign-summary.entity';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';
import { DashboardCampaignSummaryRepository } from '@/infrastructure/repositories/dashboard-campaign-summary.repository';

import { AppError } from '@/shared/errors/app-error';

import {
  CreateDashboardCampaignSummaryDto,
  DashboardCampaignSummaryDto,
  UpdateDashboardCampaignSummaryDto,
} from '@/types/dashboard-campaign-summary';

@injectable()
export class DashboardCampaignSummaryService {
  constructor(
    @inject(DashboardCampaignSummaryRepository)
    private readonly repository: DashboardCampaignSummaryRepository,
    @inject(TOKENS.CampaignRepositoryToken)
    private readonly campaignRepository: CampaignRepository,
    @inject(LoggerService) private readonly logger: LoggerService
  ) {}

  /**
   * Find dashboard campaign summary by campaign slug
   */
  async findByCampaignSlug(
    slug: string
  ): Promise<Result<DashboardCampaignSummaryDto, Error>> {
    try {
      this.logger.info('Finding dashboard campaign summary by slug', { slug });

      const result = await this.repository.findByCampaignSlug(slug);

      if (result.isErr()) {
        return Err(result.unwrapErr());
      }

      const summary = result.unwrap();

      if (summary) {
        this.logger.info(
          'Found dashboard campaign summary in dashboard table',
          {
            slug,
          }
        );
        return Ok(this.repository.mapper.toDTO(summary));
      }

      this.logger.info(
        'Dashboard campaign summary not found in dashboard table, falling back to campaign table',
        { slug }
      );

      const campaignResult = await this.campaignRepository.findOne({
        where: { slug },
      });

      if (campaignResult.isErr()) {
        return Err(campaignResult.unwrapErr());
      }

      const campaign = campaignResult.unwrap();

      if (!campaign) {
        return Err(new AppError(`Campaign not found for slug: ${slug}`));
      }

      this.logger.info('Found campaign in campaign table', { slug });

      return Ok(
        this.repository.mapper.toDTO(
          campaign as unknown as DashboardCampaignSummary
        )
      );
    } catch (error) {
      this.logger.error(
        'Error finding dashboard campaign summary by slug',
        error as Error
      );
      return Err(
        new Error(
          `Failed to find dashboard campaign summary by slug: ${
            (error as Error).message
          }`
        )
      );
    }
  }

  /**
   * Create or update dashboard campaign summary
   */
  async createOrUpdate(
    dto: CreateDashboardCampaignSummaryDto | UpdateDashboardCampaignSummaryDto
  ): Promise<Result<DashboardCampaignSummary, Error>> {
    try {
      this.logger.info('Creating or updating dashboard campaign summary', {
        campaignId: dto.campaignId,
      });

      const summary = DashboardCampaignSummary.create({
        campaignId: dto.campaignId,
        summary: dto.summary || '',
        tagLine: dto.tagLine || '',
      });

      if (summary.isErr()) {
        return Err(summary.unwrapErr());
      }

      const saveResult = await this.repository.createOrUpdate(summary.unwrap());

      if (saveResult.isErr()) {
        return Err(saveResult.unwrapErr());
      }

      const savedSummary = saveResult.unwrap();

      this.logger.info(
        'Dashboard campaign summary created/updated successfully',
        {
          id: savedSummary.id,
          campaignId: dto.campaignId,
        }
      );

      return Ok(savedSummary);
    } catch (error) {
      this.logger.error(
        'Error creating or updating dashboard campaign summary',
        error as Error
      );
      return Err(
        new Error(
          `Failed to create or update dashboard campaign summary: ${
            (error as Error).message
          }`
        )
      );
    }
  }
}
