import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'tsyringe';

import { DashboardSocialsService } from '@/application/services/dashboard-socials.service';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { BaseController } from '@/presentation/controllers/base.controller';

import { NotFoundError } from '@/shared/errors';
import { ErrorConverter } from '@/shared/utils/error-converter';
import { AuthenticatedRequest } from '@/shared/utils/middleware/auth.middleware';

import {
  CreateDashboardSocialsRequest,
  GetByCampaignIdRequest,
  GetByCampaignSlugRequest,
  GetDashboardSocialsRequest,
  ReviewDashboardSocialsDto,
  ReviewDashboardSocialsRequest,
  SubmitDashboardSocialsRequest,
  UpdateDashboardSocialsRequest,
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

  /**
   * Create new dashboard socials
   * POST /api/v2/dashboard-socials
   */
  async create(
    request: FastifyRequest<CreateDashboardSocialsRequest> &
      AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    const userId = this.requireAuth(request);

    const result = await this.service.create(request.body, userId);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardSocials = result.unwrap();
    return this.created(
      reply,
      dashboardSocials.toObject(),
      'Dashboard socials created successfully'
    );
  }

  /**
   * Update dashboard socials
   * PUT /api/v2/dashboard-socials/:id
   */
  async update(
    request: FastifyRequest<UpdateDashboardSocialsRequest> &
      AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    const userId = this.requireAuth(request);
    const { id } = request.params;

    const result = await this.service.update(id, request.body, userId);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardSocials = result.unwrap();
    return this.ok(
      reply,
      dashboardSocials.toObject(),
      'Dashboard socials updated successfully'
    );
  }

  /**
   * Submit dashboard socials for review
   * POST /api/v2/dashboard-socials/:id/submit
   */
  async submit(
    request: FastifyRequest<SubmitDashboardSocialsRequest> &
      AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    const userId = this.requireAuth(request);
    const { id } = request.params;

    const result = await this.service.submit(id, userId);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardSocials = result.unwrap();
    return this.ok(
      reply,
      dashboardSocials.toObject(),
      'Dashboard socials submitted for review successfully'
    );
  }

  /**
   * Review dashboard socials (admin only)
   * POST /api/v2/dashboard-socials/:id/review
   */
  async review(
    request: FastifyRequest<ReviewDashboardSocialsRequest> &
      AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    const adminId = this.requireAdmin(request);
    const { id } = request.params;

    const reviewDto: ReviewDashboardSocialsDto = {
      ...request.body,
      adminId,
    };

    const result = await this.service.review(id, reviewDto);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardSocials = result.unwrap();
    return this.ok(
      reply,
      dashboardSocials.toObject(),
      `Dashboard socials ${reviewDto.action}d successfully`
    );
  }

  /**
   * Get dashboard socials by ID
   * GET /api/v2/dashboard-socials/:id
   */
  async getById(
    request: FastifyRequest<GetDashboardSocialsRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    this.requireAuth(request);
    const { id } = request.params;

    const result = await this.service.getById(id);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardSocials = result.unwrap();
    if (!dashboardSocials) {
      throw new NotFoundError('Dashboard socials', id);
    }

    return this.ok(reply, dashboardSocials.toObject());
  }

  /**
   * Get dashboard socials by campaign ID
   * GET /api/v2/dashboard-socials/campaign/:campaignId
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

    const dashboardSocials = result.unwrap();
    if (!dashboardSocials) {
      throw new NotFoundError('Dashboard socials for campaign', campaignId);
    }

    return this.ok(reply, dashboardSocials.toObject());
  }

  /**
   * Get dashboard socials by campaign slug
   * GET /api/v2/dashboard-socials/campaign/slug/:campaignSlug
   */
  async getByCampaignSlug(
    request: FastifyRequest<GetByCampaignSlugRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    this.requireAuth(request);
    const { campaignSlug } = request.params;

    const result = await this.service.getByCampaignSlug(campaignSlug);

    if (result.isErr()) {
      throw ErrorConverter.fromResult(result);
    }

    const dashboardSocials = result.unwrap();
    if (!dashboardSocials) {
      throw new NotFoundError(
        'Dashboard socials for campaign slug',
        campaignSlug
      );
    }

    return this.ok(reply, dashboardSocials.toObject());
  }

  /**
   * Get pending dashboard socials for admin review
   * GET /api/v2/dashboard-socials/admin/pending
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
   * Get user's dashboard socials
   * GET /api/v2/dashboard-socials/user/my-submissions
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
   * Get dashboard socials statistics (admin only)
   * GET /api/v2/dashboard-socials/admin/statistics
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
