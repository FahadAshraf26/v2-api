import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'tsyringe';

import { DashboardReviewService } from '@/application/services/dashboard-review.service';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { BaseController } from '@/presentation/controllers/base.controller';

import { ReviewSubmissionDto } from '@/types/dashboard-submission';

@injectable()
export class DashboardReviewController extends BaseController {
  constructor(
    @inject(DashboardReviewService)
    private readonly dashboardReviewService: DashboardReviewService,
    @inject(LoggerService) protected override readonly logger: LoggerService
  ) {
    super(logger);
  }

  async reviewSubmission(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    await this.execute(request, reply, () =>
      this.dashboardReviewService.reviewSubmission(
        request.body as ReviewSubmissionDto
      )
    );
  }
}
