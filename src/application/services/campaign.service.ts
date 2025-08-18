import { Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { PaginatedResult } from '@/domain/core/repository.interface';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';

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
  ): Promise<Result<PaginatedResult<PendingCampaignDto>, Error>> {
    const result = await this.campaignRepository.findPendingWithFilters(dto);

    if (result.isErr()) {
      return result;
    }

    // Manually map to DTO to ensure we have plain objects for serialization
    const paginatedResult = result.unwrap();
    const dtoItems = paginatedResult.items.map(item => ({
      campaignName: item.campaignName,
      campaignStage: item.campaignStage,
      submittedBy: item.submittedBy,
      submittedAt: item.submittedAt,
      status: item.status,
    }));

    return Ok({
      ...paginatedResult,
      items: dtoItems,
    });
  }
}
