import { FastifyInstance } from 'fastify';
import dashboardCampaignInfoRoutes from './dashboard-campaign-info.routes';

export default async function routes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(dashboardCampaignInfoRoutes, {
    prefix: '/dashboard-campaign-info',
  });
}
