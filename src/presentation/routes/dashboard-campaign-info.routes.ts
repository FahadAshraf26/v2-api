import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { DashboardCampaignInfoController } from '@/presentation/controllers/dashboard-campaign-info.controller';

import { AuthMiddleware } from '@/shared/utils/middleware/auth.middleware';

import {
  createDashboardCampaignInfoSchema,
  errorSchema,
  successResponseSchema,
} from '@/types/dashboard-campaign-info';

export default async function dashboardCampaignInfoRoutes(
  fastify: FastifyInstance,
  options: { authMiddleware: AuthMiddleware }
): Promise<void> {
  const controller = container.resolve(DashboardCampaignInfoController);
  const { authenticateUser } = options.authMiddleware;

  fastify.get(
    '/:slug',
    {
      preHandler: authenticateUser,
      schema: {
        description: 'Get dashboard campaign info by campaign slug',
        tags: ['Dashboard Campaign Info'],
        params: {
          type: 'object',
          properties: {
            slug: { type: 'string' },
          },
          required: ['slug'],
        },
        response: {
          200: successResponseSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    controller.findByCampaignSlug.bind(controller)
  );

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
