import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'tsyringe';

import { DashboardCampaignSummaryService } from '@/application/services/dashboard-campaign-summary.service';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { BaseController } from '@/presentation/controllers/base.controller';

import {
  CreateDashboardCampaignSummaryDto,
  UpdateDashboardCampaignSummaryDto,
} from '@/types/dashboard-campaign-summary';

@injectable()
export class DashboardCampaignSummaryController extends BaseController {
  constructor(
    @inject(DashboardCampaignSummaryService)
    private readonly service: DashboardCampaignSummaryService,
    @inject(LoggerService) logger: LoggerService
  ) {
    super(logger);
  }

  async findByCampaignSlug(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    await this.execute(request, reply, () => {
      const { slug } = request.params as { slug: string };
      return this.service.findByCampaignSlug(slug);
    });
  }

  async createOrUpdate(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    await this.execute(request, reply, () => {
      const dto = request.body as
        | CreateDashboardCampaignSummaryDto
        | UpdateDashboardCampaignSummaryDto;
      return this.service.createOrUpdate(dto);
    });
  }
}
