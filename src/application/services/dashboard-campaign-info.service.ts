import { randomUUID } from 'crypto';
import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { DashboardCampaignInfo } from '@/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';
import { DashboardCampaignInfoRepository } from '@/infrastructure/repositories/dashboard-campaign-info.repository';

import { AppError } from '@/shared/errors/app-error';

import {
  CreateDashboardCampaignInfoDto,
  UpdateDashboardCampaignInfoDto,
} from '@/types/dashboard-campaign-info';

@injectable()
export class DashboardCampaignInfoService {
  constructor(
    @inject(DashboardCampaignInfoRepository)
    private readonly repository: DashboardCampaignInfoRepository,
    @inject(TOKENS.CampaignRepositoryToken)
    private readonly campaignRepository: CampaignRepository,
    @inject(LoggerService) private readonly logger: LoggerService
  ) {}

  /**
   * Create or update dashboard campaign info
   */
  async createOrUpdate(
    dto: CreateDashboardCampaignInfoDto | UpdateDashboardCampaignInfoDto
  ): Promise<Result<DashboardCampaignInfo, Error>> {
    try {
      this.logger.info('Creating or updating dashboard campaign info', {
        campaignId: dto.campaignId,
      });

      const info = DashboardCampaignInfo.create({
        campaignId: dto.campaignId,
        milestones: dto.milestones ? JSON.stringify(dto.milestones) : null,
        investorPitch: dto.investorPitch || '',
        isShowPitch: dto.isShowPitch || false,
        investorPitchTitle: dto.investorPitchTitle || '',
      });

      if (info.isErr()) {
        return Err(info.unwrapErr());
      }

      const saveResult = await this.repository.createOrUpdate(info.unwrap());

      if (saveResult.isErr()) {
        return Err(saveResult.unwrapErr());
      }

      this.logger.info('Dashboard campaign info created/updated successfully', {
        id: saveResult.unwrap().id,
        campaignId: dto.campaignId,
      });

      return Ok(saveResult.unwrap());
    } catch (error) {
      this.logger.error(
        'Error creating or updating dashboard campaign info',
        error as Error
      );
      return Err(
        new Error(
          `Failed to create or update dashboard campaign info: ${
            (error as Error).message
          }`
        )
      );
    }
  }
}
