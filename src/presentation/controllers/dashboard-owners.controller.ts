import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'tsyringe';

import { DashboardOwnersService } from '@/application/services/dashboard-owners.service';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { BaseController } from '@/presentation/controllers/base.controller';

import { UpsertDashboardOwnerDto } from '@/types/dashboard-owners';

@injectable()
export class DashboardOwnersController extends BaseController {
  constructor(
    @inject(DashboardOwnersService)
    private readonly service: DashboardOwnersService,
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
      const { campaignId, owners } = request.body as {
        campaignId: string;
        owners: UpsertDashboardOwnerDto[];
      };
      return this.service.createOrUpdate(owners, campaignId);
    });
  }
}
