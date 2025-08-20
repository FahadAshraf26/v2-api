import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'tsyringe';

import { CampaignService } from '@/application/services/campaign.service';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { BaseController } from '@/presentation/controllers/base.controller';

import { GetPendingCampaignsDto } from '@/types/campaign/get-pending-campaigns.dto';

@injectable()
export class CampaignController extends BaseController {
  constructor(
    @inject(CampaignService) private readonly campaignService: CampaignService,
    @inject(LoggerService) logger: LoggerService
  ) {
    super(logger);
  }

  async getPendingCampaigns(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    await this.execute(request, reply, () =>
      this.campaignService.getPendingCampaigns(
        request.query as GetPendingCampaignsDto
      )
    );
  }
}
