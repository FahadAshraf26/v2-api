import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'tsyringe';

import { DashboardSocialsService } from '@/application/services/dashboard-socials.service';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { BaseController } from '@/presentation/controllers/base.controller';

import {
  CreateDashboardSocialsDto,
  UpdateDashboardSocialsDto,
} from '@/types/dashboard-socials';

@injectable()
export class DashboardSocialsController extends BaseController {
  constructor(
    @inject(DashboardSocialsService)
    private readonly service: DashboardSocialsService,
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
        | CreateDashboardSocialsDto
        | UpdateDashboardSocialsDto;
      return this.service.createOrUpdate(dto);
    });
  }
}
