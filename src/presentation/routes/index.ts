import { FastifyInstance } from 'fastify';

import dashboardCampaignInfoRoutes from './dashboard-campaign-info.routes';
import dashboardCampaignSummaryRoutes from './dashboard-campaign-summary.routes';
import dashboardSocialsRoutes from './dashboard-socials.routes';
import dashboardSubmissionRoutes from './dashboard-submission.routes';

export default async function routes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(dashboardCampaignInfoRoutes, {
    prefix: '/dashboard-campaign-info',
  });

  await fastify.register(dashboardCampaignSummaryRoutes, {
    prefix: '/dashboard-campaign-summary',
  });

  await fastify.register(dashboardSocialsRoutes, {
    prefix: '/dashboard-socials',
  });

  await fastify.register(dashboardSubmissionRoutes, {
    prefix: '/dashboard-submission',
  });
}
