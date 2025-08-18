import { FastifyInstance } from 'fastify';

import campaignRoutes from './campaign.routes';
import dashboardCampaignInfoRoutes from './dashboard-campaign-info.routes';
import dashboardCampaignSummaryRoutes from './dashboard-campaign-summary.routes';
import dashboardReviewRoutes from './dashboard-review.routes';
import dashboardSocialsRoutes from './dashboard-socials.routes';
import dashboardSubmissionRoutes from './dashboard-submission.routes';

export default async function registerRoutes(
  fastify: FastifyInstance
): Promise<void> {
  fastify.register(dashboardCampaignInfoRoutes, {
    prefix: '/dashboard/campaign-info',
  });
  fastify.register(dashboardCampaignSummaryRoutes, {
    prefix: '/dashboard/campaign-summary',
  });
  fastify.register(dashboardSocialsRoutes, { prefix: '/dashboard/socials' });
  fastify.register(dashboardSubmissionRoutes, { prefix: '/dashboard' });
  fastify.register(dashboardReviewRoutes, { prefix: '/dashboard' });
  fastify.register(campaignRoutes, { prefix: '/campaigns' });
}
