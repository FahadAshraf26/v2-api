import { FastifyRequest, FastifyReply } from 'fastify';
import { injectable, inject } from 'tsyringe';
import { DashboardCampaignSummaryService } from '@/application/services/dashboard-campaign-summary.service';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { AuthenticatedRequest } from '@/shared/utils/middleware/auth.middleware';
import { BaseController } from '@/presentation/controllers/base.controller';
import { ErrorConverter } from '@/shared/utils/error-converter';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '@/shared/errors';
import {
  CreateDashboardCampaignSummaryRequest,
  GetByCampaignIdRequest,
  GetDashboardCampaignSummaryRequest,
  ReviewDashboardCampaignSummaryDto,
  ReviewDashboardCampaignSummaryRequest,
  SubmitDashboardCampaignSummaryRequest,
  UpdateDashboardCampaignSummaryRequest,
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

  /**
   * Create new dashboard campaign summary
   * POST /api/v2/dashboard-campaign-summary
   */
  async create(
    request: FastifyRequest<CreateDashboardCampaignSummaryRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    const userId = this.requireAuth(request);

    const result = await this.service.create(request.body, userId);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardSummary = result.unwrap();
    return this.created(reply, dashboardSummary.toObject(),
      'Dashboard campaign summary created successfully');
  }

  /**
   * Update dashboard campaign summary
   * PUT /api/v2/dashboard-campaign-summary/:id
   */
  async update(
    request: FastifyRequest<UpdateDashboardCampaignSummaryRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    const userId = this.requireAuth(request);
    const { id } = request.params;

    const result = await this.service.update(id, request.body, userId);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardSummary = result.unwrap();
    return this.ok(reply, dashboardSummary.toObject(),
      'Dashboard campaign summary updated successfully');
  }

  /**
   * Submit dashboard campaign summary for review
   * POST /api/v2/dashboard-campaign-summary/:id/submit
   */
  async submit(
    request: FastifyRequest<SubmitDashboardCampaignSummaryRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    const userId = this.requireAuth(request);
    const { id } = request.params;

    const result = await this.service.submit(id, userId);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardSummary = result.unwrap();
    return this.ok(reply, dashboardSummary.toObject(),
      'Dashboard campaign summary submitted for review successfully');
  }

  /**
   * Review dashboard campaign summary (admin only)
   * POST /api/v2/dashboard-campaign-summary/:id/review
   */
  async review(
    request: FastifyRequest<ReviewDashboardCampaignSummaryRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    const adminId = this.requireAdmin(request);
    const { id } = request.params;

    const reviewDto: ReviewDashboardCampaignSummaryDto = {
      ...request.body,
      adminId,
    };

    const result = await this.service.review(id, reviewDto);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardSummary = result.unwrap();
    return this.ok(reply, dashboardSummary.toObject(),
      `Dashboard campaign summary ${reviewDto.action}d successfully`);
  }

  /**
   * Get dashboard campaign summary by ID
   * GET /api/v2/dashboard-campaign-summary/:id
   */
  async getById(
    request: FastifyRequest<GetDashboardCampaignSummaryRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    this.requireAuth(request);
    const { id } = request.params;

    const result = await this.service.getById(id);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardSummary = result.unwrap();
    if (!dashboardSummary) {
      throw new NotFoundError('Dashboard campaign summary', id);
    }

    return this.ok(reply, dashboardSummary.toObject());
  }

  /**
   * Get dashboard campaign summary by campaign ID
   * GET /api/v2/dashboard-campaign-summary/campaign/:campaignId
   */
  async getByCampaignId(
    request: FastifyRequest<GetByCampaignIdRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    this.requireAuth(request);
    const { campaignId } = request.params;

    const result = await this.service.getByCampaignId(campaignId);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardSummary = result.unwrap();
    if (!dashboardSummary) {
      throw new NotFoundError('Dashboard campaign summary for campaign', campaignId);
    }

    return this.ok(reply, dashboardSummary.toObject());
  }

  /**
   * Get pending dashboard campaign summaries for admin review
   * GET /api/v2/dashboard-campaign-summary/admin/pending
   */
  async getPendingForReview(
    request: FastifyRequest & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    this.requireAdmin(request);

    const result = await this.service.getPendingForReview();

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const pendingItems = result.unwrap();
    return this.ok(reply, {
      data: pendingItems.map(item => item.toObject()),
      count: pendingItems.length,
    });
  }

  /**
   * Get user's dashboard campaign summaries
   * GET /api/v2/dashboard-campaign-summary/user/my-submissions
   */
  async getMySubmissions(
    request: FastifyRequest & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    const userId = this.requireAuth(request);

    const result = await this.service.getBySubmittedBy(userId);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const userItems = result.unwrap();
    return this.ok(reply, {
      data: userItems.map(item => item.toObject()),
      count: userItems.length,
    });
  }

  /**
   * Get all approved dashboard campaign summaries
   * GET /api/v2/dashboard-campaign-summary/approved
   */
  async getApproved(
    request: FastifyRequest & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    this.requireAuth(request);

    const result = await this.service.getApproved();

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const approvedItems = result.unwrap();
    return this.ok(reply, {
      data: approvedItems.map(item => item.toObject()),
      count: approvedItems.length,
    });
  }

  /**
   * Get dashboard campaign summary statistics (admin only)
   * GET /api/v2/dashboard-campaign-summary/admin/statistics
   */
  async getStatistics(
    request: FastifyRequest & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    this.requireAdmin(request);

    const result = await this.service.getStatistics();

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const statistics = result.unwrap();
    return this.ok(reply, statistics);
  }
}
