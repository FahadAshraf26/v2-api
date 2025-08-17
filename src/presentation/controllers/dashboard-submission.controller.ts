import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/dependency-injection';

import {
  SubmitDashboardItemsRequest,
  SubmitDashboardItemsUseCase,
} from '@/application/use-cases/submit-dashboard-items.use-case';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { DashboardApprovalRepository } from '@/infrastructure/repositories/dashboard-approval.repository';

import { BaseController } from '@/presentation/controllers/base.controller';

import { ErrorConverter } from '@/shared/utils/error-converter';
import { AuthenticatedRequest } from '@/shared/utils/middleware/auth.middleware';

interface SubmitForReviewRequest {
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

interface GetApprovalStatusRequest {
  Params: {
    campaignId: string;
  };
}

interface ReviewApprovalRequest {
  Params: {
    campaignId: string;
  };
  Body: {
    action: 'approve' | 'reject';
    comment?: string;
  };
}

@injectable()
export class DashboardSubmissionController extends BaseController {
  constructor(
    @inject(TOKENS.SubmitDashboardItemsUseCaseToken)
    private readonly submitDashboardUseCase: SubmitDashboardItemsUseCase,
    @inject(TOKENS.DashboardApprovalRepositoryToken)
    private readonly approvalRepository: DashboardApprovalRepository,
    @inject(LoggerService) logger: LoggerService
  ) {
    super(logger);
  }

  async submitForReview(
    request: FastifyRequest<SubmitForReviewRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    const userId = this.requireAuth(request);

    const useCaseRequest: SubmitDashboardItemsRequest = {
      campaignId: request.body.campaignId,
      submittedBy: userId,
      items: request.body.items,
      submissionNote: request.body.submissionNote,
    };

    const result = await this.submitDashboardUseCase.execute(useCaseRequest);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const response = result.unwrap();

    return this.ok(reply, {
      success: true,
      data: {
        submissionId: response.submissionId,
        approvalId: response.approvalId,
        status: response.status,
        submittedItems: response.submittedItems,
        message: 'Dashboard items successfully submitted for review',
      },
    });
  }

  async getApprovalStatus(
    request: FastifyRequest<GetApprovalStatusRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    this.requireAuth(request);

    const { campaignId } = request.params;

    const result = await this.approvalRepository.findByCampaignId(campaignId);
    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const approval = result.unwrap();

    return this.ok(reply, {
      success: true,
      data: approval
        ? {
            id: approval.id,
            campaignId: approval.campaignId,
            status: approval.status,
            submittedItems: approval.submittedItems,
            submittedAt: approval.submittedAt,
            submittedBy: approval.submittedBy,
            reviewedAt: approval.reviewedAt,
            reviewedBy: approval.reviewedBy,
            comment: approval.comment,
          }
        : null,
    });
  }

  async getPendingForReview(
    request: FastifyRequest & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    this.requireAdmin(request);

    const result = await this.approvalRepository.findPending();
    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const approvals = result.unwrap();

    return this.ok(reply, {
      success: true,
      data: approvals.map(approval => ({
        id: approval.id,
        campaignId: approval.campaignId,
        status: approval.status,
        submittedItems: approval.submittedItems,
        submittedAt: approval.submittedAt,
        submittedBy: approval.submittedBy,
      })),
      count: approvals.length,
    });
  }

  async reviewApproval(
    request: FastifyRequest<ReviewApprovalRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    const adminId = this.requireAdmin(request);
    const { campaignId } = request.params;
    const { action, comment } = request.body;

    const result = await this.approvalRepository.reviewApproval(
      campaignId,
      action,
      adminId,
      comment
    );

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const approval = result.unwrap();

    return this.ok(reply, {
      success: true,
      data: {
        id: approval.id,
        campaignId: approval.campaignId,
        status: approval.status,
        submittedItems: approval.submittedItems,
        reviewedAt: approval.reviewedAt,
        reviewedBy: approval.reviewedBy,
        comment: approval.comment,
      },
      message: `Approval ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });
  }

  async getStatistics(
    request: FastifyRequest & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    this.requireAdmin(request);

    const result = await this.approvalRepository.getStatistics();
    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const stats = result.unwrap();

    return this.ok(reply, {
      success: true,
      data: stats,
    });
  }
}
