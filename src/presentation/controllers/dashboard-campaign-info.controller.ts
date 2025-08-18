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

  async createOrUpdate(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const result = await this.service.createOrUpdate(
      request.body as
        | CreateDashboardCampaignInfoDto
        | UpdateDashboardCampaignInfoDto
    );

    if (result.isErr()) {
      this.logger.error('Error creating or updating dashboard campaign info', {
        error: result.unwrapErr(),
      });
      reply.status(400).send({ error: result.unwrapErr().message });
      return;
    }

    this.ok(reply, result.unwrap());
  }
}
