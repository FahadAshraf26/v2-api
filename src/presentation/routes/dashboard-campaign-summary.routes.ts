import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { container } from 'tsyringe';

import { DashboardCampaignSummaryController } from '@/presentation/controllers/dashboard-campaign-summary.controller';

import { authenticateUser } from '@/shared/utils/middleware/auth.middleware';

import {
  createDashboardCampaignSummarySchema,
  errorSchema,
  successResponseSchema,
} from '@/types/dashboard-campaign-summary';

export default async function dashboardCampaignSummaryRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const controller = container.resolve(DashboardCampaignSummaryController);

  fastify.post(
    '/',
    {
      preHandler: authenticateUser,
      schema: {
        description: 'Create or update dashboard campaign summary',
        tags: ['Dashboard Campaign Summary'],
        security: [{ bearerAuth: [] }],
        body: createDashboardCampaignSummarySchema, // Can be used for both create and update
        response: {
          200: successResponseSchema,
          201: successResponseSchema,
          400: errorSchema,
          401: errorSchema,
          409: errorSchema,
          500: errorSchema,
        },
      },
    },
    controller.createOrUpdate.bind(controller)
  );
}
