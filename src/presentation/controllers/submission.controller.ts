import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'tsyringe';

import {
  SubmitDashboardItemsRequest,
  SubmitDashboardItemsUseCase,
} from '@/application/use-cases/submit-dashboard-items.use-case';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { BaseController } from '@/presentation/controllers/base.controller';

import { ErrorConverter } from '@/shared/utils/error-converter';
import { AuthenticatedRequest } from '@/shared/utils/middleware/auth.middleware';

// HTTP Request/Response interfaces (Presentation Layer concern)
interface SubmitDashboardRequest {
  Body: {
    campaignId: string;
    items: {
      dashboardCampaignInfo?: boolean;
      dashboardCampaignSummary?: boolean;
      dashboardSocials?: boolean;
    };
    submissionNote?: string;
  };
}

@injectable()
export class SubmissionController extends BaseController {
  constructor(
    @inject(SubmitDashboardItemsUseCase)
    private readonly submitDashboardUseCase: SubmitDashboardItemsUseCase,
    @inject(LoggerService) logger: LoggerService
  ) {
    super(logger);
  }

  /**
   * Submit dashboard items for review
   * POST /api/v2/submissions/dashboard
   */
  async submitDashboardItems(
    request: FastifyRequest<SubmitDashboardRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    // 1. Authentication (Presentation concern)
    const userId = this.requireAuth(request);

    // 2. Map HTTP request to Use Case request (Presentation concern)
    const useCaseRequest: SubmitDashboardItemsRequest = {
      campaignId: request.body.campaignId,
      submittedBy: userId,
      items: request.body.items,
      submissionNote: request.body.submissionNote,
    };

    // 3. Execute use case (delegate to Application layer)
    const result = await this.submitDashboardUseCase.execute(useCaseRequest);

    // 4. Handle result and map to HTTP response (Presentation concern)
    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const response = result.unwrap();

    // 5. Return HTTP response (Presentation concern)
    return this.ok(reply, {
      success: true,
      data: response,
    });
  }
}
