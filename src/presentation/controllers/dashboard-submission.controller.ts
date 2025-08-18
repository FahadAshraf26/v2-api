import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { DashboardSubmissionService } from '@/application/services/dashboard-submission.service';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { BaseController } from '@/presentation/controllers/base.controller';

import { SubmitForReviewDto } from '@/types/dashboard-submission';

@injectable()
export class DashboardSubmissionController extends BaseController {
  constructor(
    @inject(DashboardSubmissionService)
    private readonly dashboardSubmissionService: DashboardSubmissionService,
    @inject(LoggerService) protected override readonly logger: LoggerService
  ) {
    super(logger);
  }

  async submitForReview(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { campaignId, userId, entityTypes } =
      request.body as SubmitForReviewDto;
    const result = await this.dashboardSubmissionService.submitForReview(
      campaignId,
      userId,
      entityTypes
    );

    if (result.isErr()) {
      return reply.status(400).send({ error: result.unwrapErr().message });
    }

    return this.ok(reply, { success: true });
  }
}
