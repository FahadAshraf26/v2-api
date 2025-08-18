import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'tsyringe';

import { DashboardCampaignSummaryService } from '@/application/services/dashboard-campaign-summary.service';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { BaseController } from '@/presentation/controllers/base.controller';

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/shared/errors';
import { ErrorConverter } from '@/shared/utils/error-converter';
import { AuthenticatedRequest } from '@/shared/utils/middleware/auth.middleware';

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

  async createOrUpdate(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const result = await this.service.createOrUpdate(
      request.body as
        | CreateDashboardCampaignSummaryDto
        | UpdateDashboardCampaignSummaryDto
    );

    if (result.isErr()) {
      this.logger.error(
        'Error creating or updating dashboard campaign summary',
        {
          error: result.unwrapErr(),
        }
      );
      reply.status(400).send({ error: result.unwrapErr().message });
      return;
    }

    this.ok(reply, result.unwrap());
  }
}
