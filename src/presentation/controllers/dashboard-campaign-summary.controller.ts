import { FastifyRequest, FastifyReply } from 'fastify';
import { injectable, inject } from 'tsyringe';
import { DashboardCampaignSummaryService } from '@/application/services/dashboard-campaign-summary.service';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { AuthenticatedRequest } from '@/infrastructure/middleware/auth.middleware';
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
export class DashboardCampaignSummaryController {
  constructor(
    @inject(DashboardCampaignSummaryService)
    private readonly service: DashboardCampaignSummaryService,
    @inject(LoggerService) private readonly logger: LoggerService
  ) {}

  /**
   * Create new dashboard campaign summary
   * POST /api/v2/dashboard-campaign-summary
   */
  async create(
    request: FastifyRequest<CreateDashboardCampaignSummaryRequest> &
      AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.userId) {
        return reply
          .status(401)
          .send({ error: 'User authentication required' });
      }

      const result = await this.service.create(request.body, request.userId);

      if (result.isErr()) {
        const error = result.unwrapErr();
        this.logger.warn('Failed to create dashboard campaign summary', {
          error: error.message,
        });

        if (error.message.includes('already exists')) {
          return reply.status(409).send({ error: error.message });
        }

        return reply.status(400).send({ error: error.message });
      }

      const dashboardSummary = result.unwrap();

      return reply.status(201).send({
        success: true,
        data: dashboardSummary.toObject(),
        message: 'Dashboard campaign summary created successfully',
      });
    } catch (error) {
      this.logger.error(
        'Error in create dashboard campaign summary',
        error as Error
      );
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  /**
   * Update dashboard campaign summary
   * PUT /api/v2/dashboard-campaign-summary/:id
   */
  async update(
    request: FastifyRequest<UpdateDashboardCampaignSummaryRequest> &
      AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
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
        this.logger.warn('Failed to update dashboard campaign summary', {
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

      const dashboardSummary = result.unwrap();

      return reply.status(200).send({
        success: true,
        data: dashboardSummary.toObject(),
        message: 'Dashboard campaign summary updated successfully',
      });
    } catch (error) {
      this.logger.error(
        'Error in update dashboard campaign summary',
        error as Error
      );
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  /**
   * Submit dashboard campaign summary for review
   * POST /api/v2/dashboard-campaign-summary/:id/submit
   */
  async submit(
    request: FastifyRequest<SubmitDashboardCampaignSummaryRequest> &
      AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.userId) {
        return reply
          .status(401)
          .send({ error: 'User authentication required' });
      }

      const { id } = request.params;
      const result = await this.service.submit(id, request.userId);

      if (result.isErr()) {
        const error = result.unwrapErr();
        this.logger.warn('Failed to submit dashboard campaign summary', {
          id,
          error: error.message,
        });

        if (error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }

        if (error.message.includes('already approved')) {
          return reply.status(409).send({ error: error.message });
        }

        if (error.message.includes('needs content')) {
          return reply.status(400).send({ error: error.message });
        }

        return reply.status(400).send({ error: error.message });
      }

      const dashboardSummary = result.unwrap();

      return reply.status(200).send({
        success: true,
        data: dashboardSummary.toObject(),
        message: 'Dashboard campaign summary submitted for review successfully',
      });
    } catch (error) {
      this.logger.error(
        'Error in submit dashboard campaign summary',
        error as Error
      );
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  /**
   * Review dashboard campaign summary (admin only)
   * POST /api/v2/dashboard-campaign-summary/:id/review
   */
  async review(
    request: FastifyRequest<ReviewDashboardCampaignSummaryRequest> &
      AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.adminUserId) {
        return reply
          .status(403)
          .send({ error: 'Admin authentication required' });
      }

      const { id } = request.params;
      const reviewDto: ReviewDashboardCampaignSummaryDto = {
        ...request.body,
        adminId: request.adminUserId,
      };

      const result = await this.service.review(id, reviewDto);

      if (result.isErr()) {
        const error = result.unwrapErr();
        this.logger.warn('Failed to review dashboard campaign summary', {
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

      const dashboardSummary = result.unwrap();

      return reply.status(200).send({
        success: true,
        data: dashboardSummary.toObject(),
        message: `Dashboard campaign summary ${reviewDto.action}d successfully`,
      });
    } catch (error) {
      this.logger.error(
        'Error in review dashboard campaign summary',
        error as Error
      );
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  /**
   * Get dashboard campaign summary by ID
   * GET /api/v2/dashboard-campaign-summary/:id
   */
  async getById(
    request: FastifyRequest<GetDashboardCampaignSummaryRequest> &
      AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params;
      const result = await this.service.getById(id);

      if (result.isErr()) {
        this.logger.warn('Failed to get dashboard campaign summary', {
          id,
          error: result.unwrapErr().message,
        });
        return reply
          .status(500)
          .send({ error: 'Failed to retrieve dashboard campaign summary' });
      }

      const dashboardSummary = result.unwrap();

      if (!dashboardSummary) {
        return reply
          .status(404)
          .send({ error: 'Dashboard campaign summary not found' });
      }

      return reply.status(200).send({
        success: true,
        data: dashboardSummary.toObject(),
      });
    } catch (error) {
      this.logger.error(
        'Error in get dashboard campaign summary by ID',
        error as Error
      );
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  /**
   * Get dashboard campaign summary by campaign ID
   * GET /api/v2/dashboard-campaign-summary/campaign/:campaignId
   */
  async getByCampaignId(
    request: FastifyRequest<GetByCampaignIdRequest> & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { campaignId } = request.params;
      const result = await this.service.getByCampaignId(campaignId);

      if (result.isErr()) {
        this.logger.warn(
          'Failed to get dashboard campaign summary by campaign ID',
          {
            campaignId,
            error: result.unwrapErr().message,
          }
        );
        return reply
          .status(500)
          .send({ error: 'Failed to retrieve dashboard campaign summary' });
      }

      const dashboardSummary = result.unwrap();

      if (!dashboardSummary) {
        return reply.status(404).send({
          error: 'Dashboard campaign summary not found for this campaign',
        });
      }

      return reply.status(200).send({
        success: true,
        data: dashboardSummary.toObject(),
      });
    } catch (error) {
      this.logger.error(
        'Error in get dashboard campaign summary by campaign ID',
        error as Error
      );
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  /**
   * Get pending dashboard campaign summaries for admin review
   * GET /api/v2/dashboard-campaign-summary/admin/pending
   */
  async getPendingForReview(
    request: FastifyRequest & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.adminUserId) {
        return reply
          .status(403)
          .send({ error: 'Admin authentication required' });
      }

      const result = await this.service.getPendingForReview();

      if (result.isErr()) {
        this.logger.warn('Failed to get pending dashboard campaign summaries', {
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
    } catch (error) {
      this.logger.error(
        'Error in get pending dashboard campaign summaries',
        error as Error
      );
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  /**
   * Get user's dashboard campaign summaries
   * GET /api/v2/dashboard-campaign-summary/user/my-submissions
   */
  async getMySubmissions(
    request: FastifyRequest & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.userId) {
        return reply
          .status(401)
          .send({ error: 'User authentication required' });
      }

      const result = await this.service.getBySubmittedBy(request.userId);

      if (result.isErr()) {
        this.logger.warn('Failed to get user dashboard campaign summaries', {
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
    } catch (error) {
      this.logger.error(
        'Error in get user dashboard campaign summaries',
        error as Error
      );
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  /**
   * Get approved dashboard campaign summaries
   * GET /api/v2/dashboard-campaign-summary/approved
   */
  async getApproved(
    request: FastifyRequest & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const result = await this.service.getApproved();

      if (result.isErr()) {
        this.logger.warn('Failed to get approved dashboard campaign summaries', {
          error: result.unwrapErr().message,
        });
        return reply
          .status(500)
          .send({ error: 'Failed to retrieve approved items' });
      }

      const approvedItems = result.unwrap();

      return reply.status(200).send({
        success: true,
        data: approvedItems.map(item => item.toObject()),
        count: approvedItems.length,
      });
    } catch (error) {
      this.logger.error(
        'Error in get approved dashboard campaign summaries',
        error as Error
      );
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  /**
   * Get dashboard campaign summary statistics
   * GET /api/v2/dashboard-campaign-summary/admin/statistics
   */
  async getStatistics(
    request: FastifyRequest & AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.adminUserId) {
        return reply
          .status(403)
          .send({ error: 'Admin authentication required' });
      }

      const result = await this.service.getStatistics();

      if (result.isErr()) {
        this.logger.warn('Failed to get dashboard campaign summary statistics', {
          error: result.unwrapErr().message,
        });
        return reply
          .status(500)
          .send({ error: 'Failed to retrieve statistics' });
      }

      const statistics = result.unwrap();

      return reply.status(200).send({
        success: true,
        data: statistics,
      });
    } catch (error) {
      this.logger.error(
        'Error in get dashboard campaign summary statistics',
        error as Error
      );
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}
