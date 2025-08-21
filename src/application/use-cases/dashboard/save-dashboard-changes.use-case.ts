import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { UseCase } from '@/application/core/use-case';
import { DashboardCampaignInfoService } from '@/application/services/dashboard-campaign-info.service';
import { DashboardCampaignSummaryService } from '@/application/services/dashboard-campaign-summary.service';
import { DashboardOwnersService } from '@/application/services/dashboard-owners.service';
import { DashboardSocialsService } from '@/application/services/dashboard-socials.service';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { UpdateDashboardCampaignInfoDto } from '@/types/dashboard-campaign-info';
import { UpdateDashboardCampaignSummaryDto } from '@/types/dashboard-campaign-summary';
import { UpsertDashboardOwnerDto } from '@/types/dashboard-owners';
import { UpdateDashboardSocialsDto } from '@/types/dashboard-socials';

export interface SaveDashboardChangesDto {
  campaignId: string;
  campaignInfo: UpdateDashboardCampaignInfoDto;
  campaignSummary: UpdateDashboardCampaignSummaryDto;
  socials: UpdateDashboardSocialsDto;
  owners: UpsertDashboardOwnerDto[];
}

@injectable()
export class SaveDashboardChangesUseCase extends UseCase<
  SaveDashboardChangesDto,
  void
> {
  constructor(
    @inject(LoggerService) private readonly logger: LoggerService,
    @inject(DashboardCampaignInfoService)
    private readonly dashboardCampaignInfoService: DashboardCampaignInfoService,
    @inject(DashboardCampaignSummaryService)
    private readonly dashboardCampaignSummaryService: DashboardCampaignSummaryService,
    @inject(DashboardSocialsService)
    private readonly dashboardSocialsService: DashboardSocialsService,
    @inject(DashboardOwnersService)
    private readonly dashboardOwnersService: DashboardOwnersService
  ) {
    super();
  }

  async execute(dto: SaveDashboardChangesDto): Promise<Result<void, Error>> {
    try {
      this.logger.info('Saving dashboard changes', { dto });

      const { campaignId, campaignInfo, campaignSummary, socials, owners } =
        dto;

      const campaignInfoPromise =
        this.dashboardCampaignInfoService.createOrUpdate(campaignInfo);
      const campaignSummaryPromise =
        this.dashboardCampaignSummaryService.createOrUpdate(campaignSummary);
      const socialsPromise =
        this.dashboardSocialsService.createOrUpdate(socials);
      const ownersPromise = this.dashboardOwnersService.createOrUpdate(
        owners,
        campaignId
      );

      const results = await Promise.all([
        campaignInfoPromise,
        campaignSummaryPromise,
        socialsPromise,
        ownersPromise,
      ]);

      const [campaignInfoResult, campaignSummaryResult, socialsResult] =
        results;

      if (campaignInfoResult.isErr()) {
        return Err(campaignInfoResult.unwrapErr());
      }
      if (campaignSummaryResult.isErr()) {
        return Err(campaignSummaryResult.unwrapErr());
      }
      if (socialsResult.isErr()) {
        return Err(socialsResult.unwrapErr());
      }

      return Ok(undefined);
    } catch (error) {
      this.logger.error('Error saving dashboard changes', error as Error);
      return Err(new Error('Failed to save dashboard changes'));
    }
  }
}
