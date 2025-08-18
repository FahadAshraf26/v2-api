import { randomUUID } from 'crypto';
import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { DashboardCampaignSummary } from '@/domain/dashboard-campaign-summary/entity/dashboard-campaign-summary.entity';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';
import { DashboardCampaignSummaryRepository } from '@/infrastructure/repositories/dashboard-campaign-summary.repository';

import {
  CreateDashboardCampaignSummaryDto,
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
        id: (dto as any).id || randomUUID(),
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

      this.logger.info(
        'Dashboard campaign summary created/updated successfully',
        {
          id: saveResult.unwrap().id,
          campaignId: dto.campaignId,
        }
      );

      return Ok(saveResult.unwrap());
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
