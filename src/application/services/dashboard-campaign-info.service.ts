import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { DashboardCampaignInfo } from '@/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { CampaignInfoRepository } from '@/infrastructure/repositories/campaign-info.repository';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';
import { DashboardCampaignInfoRepository } from '@/infrastructure/repositories/dashboard-campaign-info.repository';

import { AppError } from '@/shared/errors/app-error';

import {
  CreateDashboardCampaignInfoDto,
  DashboardCampaignInfoDto,
  UpdateDashboardCampaignInfoDto,
} from '@/types/dashboard-campaign-info';

@injectable()
export class DashboardCampaignInfoService {
  constructor(
    @inject(DashboardCampaignInfoRepository)
    private readonly repository: DashboardCampaignInfoRepository,
    @inject(TOKENS.CampaignRepositoryToken)
    private readonly campaignRepository: CampaignRepository,
    @inject(LoggerService) private readonly logger: LoggerService,
    @inject(TOKENS.CampaignInfoRepositoryToken)
    private readonly campaignInfoRepository: CampaignInfoRepository
  ) {}

  /**
   * Find dashboard campaign info by campaign slug
   */
  async findByCampaignSlug(
    slug: string
  ): Promise<Result<DashboardCampaignInfoDto, Error>> {
    try {
      this.logger.info('Finding dashboard campaign info by slug', { slug });

      const result = await this.repository.findByCampaignSlug(slug);

      if (result.isErr()) {
        return Err(result.unwrapErr());
      }

      const info = result.unwrap();

      if (info) {
        this.logger.info('Found dashboard campaign info in dashboard table', {
          slug,
        });
        return Ok(this.repository.mapper.toDTO(info));
      }

      this.logger.info(
        'Dashboard campaign info not found in dashboard table, falling back to campaign info table',
        { slug }
      );

      const campaignInfoResult = await this.campaignInfoRepository.findOne({
        include: [
          {
            relation: 'Campaign',
            where: { slug },
            required: true,
          },
        ],
      });

      if (campaignInfoResult.isErr()) {
        return Err(campaignInfoResult.unwrapErr());
      }

      const campaignInfo = campaignInfoResult.unwrap();

      if (!campaignInfo) {
        return Err(new AppError(`Campaign info not found for slug: ${slug}`));
      }

      this.logger.info('Found campaign info in campaign info table', { slug });

      return Ok(
        this.repository.mapper.toDTO(
          campaignInfo as unknown as DashboardCampaignInfo
        )
      );
    } catch (error) {
      this.logger.error(
        'Error finding dashboard campaign info by slug',
        error as Error
      );
      return Err(
        new Error(
          `Failed to find dashboard campaign info by slug: ${
            (error as Error).message
          }`
        )
      );
    }
  }

  /**
   * Create or update dashboard campaign info
   */
  async createOrUpdate(
    dto: CreateDashboardCampaignInfoDto | UpdateDashboardCampaignInfoDto
  ): Promise<Result<DashboardCampaignInfoDto, Error>> {
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

      const savedInfo = saveResult.unwrap();

      this.logger.info('Dashboard campaign info created/updated successfully', {
        id: savedInfo.id,
        campaignId: dto.campaignId,
      });

      return Ok(this.repository.mapper.toDTO(savedInfo));
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
