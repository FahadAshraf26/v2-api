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

  async createOrUpdate(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const result = await this.service.createOrUpdate(
      request.body as CreateDashboardSocialsDto | UpdateDashboardSocialsDto
    );

    if (result.isErr()) {
      this.logger.error('Error creating or updating dashboard socials', {
        error: result.unwrapErr(),
      });
      reply.status(400).send({ error: result.unwrapErr().message });
      return;
    }

    this.ok(reply, result.unwrap());
  }
}
