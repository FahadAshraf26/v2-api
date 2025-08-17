import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'tsyringe';

import {
  SubmitDashboardItemsRequest,
  SubmitDashboardItemsUseCase,
} from '@/application/use-cases/submit-dashboard-items.use-case';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { EmailService } from '@/infrastructure/notifications/email.service';
import { SlackService } from '@/infrastructure/notifications/slack.service';

import { BaseController } from '@/presentation/controllers/base.controller';

import { ErrorConverter } from '@/shared/utils/error-converter';
import { AuthenticatedRequest } from '@/shared/utils/middleware/auth.middleware';

// HTTP Request/Response interfaces (Presentation Layer concern)
interface SubmitForReviewRequest {
  Body: {
    campaignId: string;
    entities: {
      dashboardCampaignInfo?: boolean;
      dashboardCampaignSummary?: boolean;
      dashboardSocials?: boolean;
    };
    submissionNote?: string;
  };
}

interface TestNotificationsRequest {
  Body: {
    campaignId: string;
    campaignName?: string;
    submittedEntities: string[];
  };
}

@injectable()
export class DashboardSubmissionController extends BaseController {
  constructor(
    @inject(SubmitDashboardItemsUseCase)
    private readonly submitDashboardUseCase: SubmitDashboardItemsUseCase,
    @inject(SlackService) private readonly slackService: SlackService,
    @inject(EmailService) private readonly emailService: EmailService,
    @inject(LoggerService) logger: LoggerService
  ) {
    super(logger);
  }

  /**
   * Submit dashboard items for review
   * POST /api/v2/dashboard-submissions/submit
   */
  async submitForReview(
    request: FastifyRequest<SubmitForReviewRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    // 1. Authentication (Presentation concern)
    const userId = this.requireAuth(request);

    // 2. Map HTTP request to Use Case request (Presentation concern)
    const useCaseRequest: SubmitDashboardItemsRequest = {
      campaignId: request.body.campaignId,
      submittedBy: userId,
      items: request.body.entities, // Map 'entities' to 'items'
      submissionNote: request.body.submissionNote || undefined,
    };

    // 3. Execute use case (delegate to Application layer)
    const result = await this.submitDashboardUseCase.execute(useCaseRequest);

    // 4. Handle result and map to HTTP response (Presentation concern)
    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const response = result.unwrap();

    // 5. Map response to expected dashboard submission format
    const dashboardResponse = {
      success: true,
      submissionId: response.submissionId,
      results: response.processedItems,
      notifications: {
        slack: { sent: true }, // Events will handle notifications
        email: { sent: true, recipients: [] },
      },
    };

    // 6. Return HTTP response (Presentation concern)
    return this.ok(reply, dashboardResponse);
  }

  /**
   * Test notifications (for debugging)
   * GET /api/v2/dashboard-submissions/test-notifications
   */
  async testNotifications(
    request: FastifyRequest<TestNotificationsRequest>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const notificationData = {
        campaignId: request.body.campaignId,
        campaignName: request.body.campaignName || 'Test Campaign',
        submittedBy: 'test-user',
        submittedEntities: request.body.submittedEntities,
        submissionNote: 'Test notification',
        submissionId: 'test-submission-id',
        timestamp: new Date(),
      };

      // Test Slack notification
      const slackResult =
        await this.slackService.sendSubmissionNotification(notificationData);

      // Test Email notification
      const recipients = [
        { email: 'admin@example.com', name: 'Admin', role: 'admin' as const },
        { email: 'owner@example.com', name: 'Owner', role: 'owner' as const },
      ];
      const emailResult = await this.emailService.sendSubmissionNotifications(
        notificationData,
        recipients
      );

      return this.ok(reply, {
        success: true,
        slack: {
          success: slackResult.isOk(),
          error: slackResult.isErr() ? slackResult.unwrapErr().message : null,
        },
        email: {
          success: emailResult.isOk(),
          error: emailResult.isErr() ? emailResult.unwrapErr().message : null,
        },
      });
    } catch (error) {
      throw ErrorConverter.fromError(error as Error);
    }
  }
}
