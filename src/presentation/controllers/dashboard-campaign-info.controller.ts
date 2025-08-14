import { FastifyRequest, FastifyReply } from 'fastify';
import { injectable, inject } from 'tsyringe';
import { DashboardCampaignInfoService } from '@/application/services/dashboard-campaign-info.service';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { AuthenticatedRequest } from '@/shared/utils/middleware/auth.middleware';
import { BaseController } from '@/presentation/controllers/base.controller';
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
    request: FastifyRequest<CreateDashboardCampaignInfoRequest> &
      AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
      if (!request.userId) {
        return reply
          .status(401)
          .send({ error: 'User authentication required' });
      }

      const result = await this.service.create(request.body, request.userId);

      if (result.isErr()) {
        const error = result.unwrapErr();
        this.logger.warn('Failed to create dashboard campaign info', {
          error: error.message,
        });

        if (error.message.includes('already exists')) {
          return reply.status(409).send({ error: error.message });
        }

        return reply.status(400).send({ error: error.message });
      }

      const dashboardInfo = result.unwrap();

      return reply.status(201).send({
        success: true,
        data: dashboardInfo.toObject(),
        message: 'Dashboard campaign info created successfully',
      });
  }

  /**
   * Update dashboard campaign info
   * PUT /api/v2/dashboard-campaign-info/:id
   */
  async update(
    request: FastifyRequest<UpdateDashboardCampaignInfoRequest> &
      AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
      if (!request.userId) {
        return reply
          .status(401)
          .send({ error: 'User authentication required' });
      }

      const { id } = request.params;
      const result = await this.service.update(
        id,
        request.body,
        request.userId
      );

      if (result.isErr()) {
        const error = result.unwrapErr();
        this.logger.warn('Failed to update dashboard campaign info', {
          id,
          error: error.message,
        });

        if (error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }

        if (
          error.message.includes('not authorized') ||
          error.message.includes('approved')
        ) {
          return reply.status(403).send({ error: error.message });
        }

        return reply.status(400).send({ error: error.message });
      }

      const dashboardInfo = result.unwrap();

      return reply.status(200).send({
        success: true,
        data: dashboardInfo.toObject(),
        message: 'Dashboard campaign info updated successfully',
      });
  }

  /**
   * Submit dashboard campaign info for review
   * POST /api/v2/dashboard-campaign-info/:id/submit
   */
  async submit(
    request: FastifyRequest<SubmitDashboardCampaignInfoRequest> &
      AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {

      if (!request.userId) {
        return reply
          .status(401)
          .send({ error: 'User authentication required' });
      }

      const { id } = request.params;
      const result = await this.service.submit(id, request.userId);

      if (result.isErr()) {
        const error = result.unwrapErr();
        this.logger.warn('Failed to submit dashboard campaign info', {
          id,
          error: error.message,
        });

        if (error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }

        if (error.message.includes('already approved')) {
          return reply.status(409).send({ error: error.message });
        }

        return reply.status(400).send({ error: error.message });
      }

      const dashboardInfo = result.unwrap();

      return reply.status(200).send({
        success: true,
        data: dashboardInfo.toObject(),
        message: 'Dashboard campaign info submitted for review successfully',
      });
  }

  /**
   * Review dashboard campaign info (admin only)
   * POST /api/v2/dashboard-campaign-info/:id/review
   */
  async review(
    request: FastifyRequest<ReviewDashboardCampaignInfoRequest> &
      AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
      if (!request.adminUserId) {
        return reply
          .status(403)
          .send({ error: 'Admin authentication required' });
      }

      const { id } = request.params;
      const reviewDto: ReviewDashboardCampaignInfoDto = {
        ...request.body,
        adminId: request.adminUserId,
      };

      const result = await this.service.review(id, reviewDto);

      if (result.isErr()) {
        const error = result.unwrapErr();
        this.logger.warn('Failed to review dashboard campaign info', {
          id,
          action: reviewDto.action,
          error: error.message,
        });

        if (error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }

        if (error.message.includes('Comment is required')) {
          return reply.status(400).send({ error: error.message });
        }

        return reply.status(400).send({ error: error.message });
      }

      const dashboardInfo = result.unwrap();

      return reply.status(200).send({
        success: true,
        data: dashboardInfo.toObject(),
        message: `Dashboard campaign info ${reviewDto.action}d successfully`,
      });

  }

  /**
   * Get dashboard campaign info by ID
   * GET /api/v2/dashboard-campaign-info/:id
   */
  async getById(
    request: FastifyRequest<GetDashboardCampaignInfoRequest> &
      AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
      const { id } = request.params;
      const result = await this.service.getById(id);

      if (result.isErr()) {
        this.logger.warn('Failed to get dashboard campaign info', {
          id,
          error: result.unwrapErr().message,
        });
        return reply
          .status(500)
          .send({ error: 'Failed to retrieve dashboard campaign info' });
      }

      const dashboardInfo = result.unwrap();

      if (!dashboardInfo) {
        return reply
          .status(404)
          .send({ error: 'Dashboard campaign info not found' });
      }

      return reply.status(200).send({
        success: true,
        data: dashboardInfo.toObject(),
      });

  }

  /**
   * Get dashboard campaign info by campaign ID
   * GET /api/v2/dashboard-campaign-info/campaign/:campaignId
   */
  async getByCampaignId(
    request: FastifyRequest<GetByCampaignIdRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
      const { campaignId } = request.params;
      const result = await this.service.getByCampaignId(campaignId);

      if (result.isErr()) {
        this.logger.warn(
          'Failed to get dashboard campaign info by campaign ID',
          {
            campaignId,
            error: result.unwrapErr().message,
          }
        );
        return reply
          .status(500)
          .send({ error: 'Failed to retrieve dashboard campaign info' });
      }

      const dashboardInfo = result.unwrap();

      if (!dashboardInfo) {
        return reply.status(404).send({
          error: 'Dashboard campaign info not found for this campaign',
        });
      }

      return reply.status(200).send({
        success: true,
        data: dashboardInfo.toObject(),
      });

  }

  /**
   * Get pending dashboard campaign infos for admin review
   * GET /api/v2/dashboard-campaign-info/admin/pending
   */
  async getPendingForReview(
    request: FastifyRequest & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {

      if (!request.adminUserId) {
        return reply
          .status(403)
          .send({ error: 'Admin authentication required' });
      }

      const result = await this.service.getPendingForReview();

      if (result.isErr()) {
        this.logger.warn('Failed to get pending dashboard campaign infos', {
          error: result.unwrapErr().message,
        });
        return reply
          .status(500)
          .send({ error: 'Failed to retrieve pending items' });
      }

      const pendingItems = result.unwrap();

      return reply.status(200).send({
        success: true,
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
      if (!request.userId) {
        return reply
          .status(401)
          .send({ error: 'User authentication required' });
      }

      const result = await this.service.getBySubmittedBy(request.userId);

      if (result.isErr()) {
        this.logger.warn('Failed to get user dashboard campaign infos', {
          userId: request.userId,
          error: result.unwrapErr().message,
        });
        return reply
          .status(500)
          .send({ error: 'Failed to retrieve your submissions' });
      }

      const userItems = result.unwrap();

      return reply.status(200).send({
        success: true,
        data: userItems.map(item => item.toObject()),
        count: userItems.length,
      });

  }
}
