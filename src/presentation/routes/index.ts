import { FastifyInstance } from 'fastify';

import { createAuthMiddleware } from '@/shared/utils/middleware/auth.middleware';

import campaignRoutes from './campaign.routes';
import dashboardCampaignInfoRoutes from './dashboard-campaign-info.routes';
import dashboardCampaignSummaryRoutes from './dashboard-campaign-summary.routes';
import dashboardOwnersRoutes from './dashboard-owners.routes';
import dashboardReviewRoutes from './dashboard-review.routes';
import dashboardSocialsRoutes from './dashboard-socials.routes';
import dashboardSubmissionRoutes from './dashboard-submission.routes';
import dashboardRoutes from './dashboard.routes';

export default async function registerRoutes(
  fastify: FastifyInstance
): Promise<void> {
  const authMiddleware = createAuthMiddleware();

  fastify.register(dashboardCampaignInfoRoutes, {
    prefix: '/dashboard/campaign-info',
    authMiddleware,
  });
  fastify.register(dashboardCampaignSummaryRoutes, {
    prefix: '/dashboard/campaign-summary',
    authMiddleware,
  });
  fastify.register(dashboardSocialsRoutes, {
    prefix: '/dashboard/socials',
    authMiddleware,
  });
  fastify.register(dashboardOwnersRoutes, {
    prefix: '/dashboard/owners',
    authMiddleware,
  });
  fastify.register(dashboardSubmissionRoutes, {
    prefix: '/dashboard',
    authMiddleware,
  });
  fastify.register(dashboardReviewRoutes, {
    prefix: '/dashboard',
    authMiddleware,
  });
  fastify.register(campaignRoutes, { prefix: '/campaigns', authMiddleware });
  fastify.register(dashboardRoutes, { prefix: '/dashboard', authMiddleware });
}
