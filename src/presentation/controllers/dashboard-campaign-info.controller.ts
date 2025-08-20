import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'tsyringe';

import { DashboardCampaignInfoService } from '@/application/services/dashboard-campaign-info.service';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { BaseController } from '@/presentation/controllers/base.controller';

import {
  CreateDashboardCampaignInfoDto,
  UpdateDashboardCampaignInfoDto,
} from '@/types/dashboard-campaign-info';

@injectable()
export class DashboardCampaignInfoController extends BaseController {
  constructor(
    @inject(DashboardCampaignInfoService)
    private readonly service: DashboardCampaignInfoService,
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
        | CreateDashboardCampaignInfoDto
        | UpdateDashboardCampaignInfoDto;
      return this.service.createOrUpdate(dto);
    });
  }
}
