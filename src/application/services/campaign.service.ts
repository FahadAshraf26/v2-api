import { Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';

import { PaginatedDto } from '@/shared/dtos/paginated.dto';

import {
  GetPendingCampaignsDto,
  PendingCampaignDto,
} from '@/types/campaign/get-pending-campaigns.dto';

@injectable()
export class CampaignService {
  constructor(
    @inject(TOKENS.CampaignRepositoryToken)
    private readonly campaignRepository: CampaignRepository,
    @inject(LoggerService) private readonly logger: LoggerService
  ) {}

  async getPendingCampaigns(
    dto: GetPendingCampaignsDto
  ): Promise<Result<PaginatedDto<PendingCampaignDto>, Error>> {
    const result = await this.campaignRepository.findPendingWithFilters(dto);

    if (result.isErr()) {
      return result;
    }

    const paginatedResult = result.unwrap();
    const paginatedDto = new PaginatedDto({
      ...paginatedResult,
      items: paginatedResult.items.map(item => ({
        campaignName: item.campaignName,
        campaignStage: item.campaignStage,
        campaignId: item.campaignId,
        issuerId: item.issuerId,
        submittedBy: item.submittedBy,
        submittedAt: item.submittedAt,
        status: item.status,
      })),
    });

    return Ok(paginatedDto);
  }
}
