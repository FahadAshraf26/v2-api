import { FastifyRequest, FastifyReply } from 'fastify';
import { injectable, inject } from 'tsyringe';
import { DashboardCampaignInfoService } from '@/application/services/dashboard-campaign-info.service';
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
  CreateDashboardCampaignInfoRequest,
  GetByCampaignIdRequest,
  GetDashboardCampaignInfoRequest,
  ReviewDashboardCampaignInfoDto,
  ReviewDashboardCampaignInfoRequest,
  SubmitDashboardCampaignInfoRequest,
  UpdateDashboardCampaignInfoRequest,
} from '@/types/dashboard-campaign-info';

@injectable()
export class DashboardCampaignInfoController extends BaseController {
  constructor(
    @inject(DashboardCampaignInfoService)
    private readonly service: DashboardCampaignInfoService,
    @inject(LoggerService) logger: LoggerService
  ) {
    super(logger);
  }

  /**
   * Create new dashboard campaign info
   * POST /api/v2/dashboard-campaign-info
   */
  async create(
    request: FastifyRequest<CreateDashboardCampaignInfoRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    const userId = this.requireAuth(request);

    const result = await this.service.create(request.body, userId);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardInfo = result.unwrap();
    return this.created(reply, dashboardInfo.toObject(),
      'Dashboard campaign info created successfully');
  }

  /**
   * Update dashboard campaign info
   * PUT /api/v2/dashboard-campaign-info/:id
   */
  async update(
    request: FastifyRequest<UpdateDashboardCampaignInfoRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    const userId = this.requireAuth(request);
    const { id } = request.params;

    const result = await this.service.update(id, request.body, userId);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardInfo = result.unwrap();
    return this.ok(reply, dashboardInfo.toObject(),
      'Dashboard campaign info updated successfully');
  }

  /**
   * Submit dashboard campaign info for review
   * POST /api/v2/dashboard-campaign-info/:id/submit
   */
  async submit(
    request: FastifyRequest<SubmitDashboardCampaignInfoRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    const userId = this.requireAuth(request);
    const { id } = request.params;

    const result = await this.service.submit(id, userId);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardInfo = result.unwrap();
    return this.ok(reply, dashboardInfo.toObject(),
      'Dashboard campaign info submitted for review successfully');
  }

  /**
   * Review dashboard campaign info (admin only)
   * POST /api/v2/dashboard-campaign-info/:id/review
   */
  async review(
    request: FastifyRequest<ReviewDashboardCampaignInfoRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    const adminId = this.requireAdmin(request);
    const { id } = request.params;

    const reviewDto: ReviewDashboardCampaignInfoDto = {
      ...request.body,
      adminId,
    };

    const result = await this.service.review(id, reviewDto);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardInfo = result.unwrap();
    return this.ok(reply, dashboardInfo.toObject(),
      `Dashboard campaign info ${reviewDto.action}d successfully`);
  }

  /**
   * Get dashboard campaign info by ID
   * GET /api/v2/dashboard-campaign-info/:id
   */
  async getById(
    request: FastifyRequest<GetDashboardCampaignInfoRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    this.requireAuth(request);
    const { id } = request.params;

    const result = await this.service.getById(id);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardInfo = result.unwrap();
    if (!dashboardInfo) {
      throw new NotFoundError('Dashboard campaign info', id);
    }

    return this.ok(reply, dashboardInfo.toObject());
  }

  /**
   * Get dashboard campaign info by campaign ID
   * GET /api/v2/dashboard-campaign-info/campaign/:campaignId
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

    const dashboardInfo = result.unwrap();
    if (!dashboardInfo) {
      throw new NotFoundError('Dashboard campaign info for campaign', campaignId);
    }

    return this.ok(reply, dashboardInfo.toObject());
  }

  /**
   * Get pending dashboard campaign infos for admin review
   * GET /api/v2/dashboard-campaign-info/admin/pending
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
   * Get user's dashboard campaign infos
   * GET /api/v2/dashboard-campaign-info/user/my-submissions
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
}
