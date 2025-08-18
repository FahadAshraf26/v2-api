import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { container } from 'tsyringe';

import { DashboardCampaignInfoController } from '@/presentation/controllers/dashboard-campaign-info.controller';

import { authenticateUser } from '@/shared/utils/middleware/auth.middleware';

import {
  createDashboardCampaignInfoSchema,
  errorSchema,
  successResponseSchema,
  updateDashboardCampaignInfoSchema,
} from '@/types/dashboard-campaign-info';

export default async function dashboardCampaignInfoRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const controller = container.resolve(DashboardCampaignInfoController);

  fastify.post(
    '/',
    {
      preHandler: authenticateUser,
      schema: {
        description: 'Create or update dashboard campaign info',
        tags: ['Dashboard Campaign Info'],
        security: [{ bearerAuth: [] }],
        body: createDashboardCampaignInfoSchema, // Can be used for both create and update
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
