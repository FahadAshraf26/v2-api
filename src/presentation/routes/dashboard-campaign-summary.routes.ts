import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { DashboardCampaignSummaryController } from '@/presentation/controllers/dashboard-campaign-summary.controller';

import { AuthMiddleware } from '@/shared/utils/middleware/auth.middleware';

import {
  createDashboardCampaignSummarySchema,
  errorSchema,
  successResponseSchema,
} from '@/types/dashboard-campaign-summary';

export default async function dashboardCampaignSummaryRoutes(
  fastify: FastifyInstance,
  options: { authMiddleware: AuthMiddleware }
): Promise<void> {
  const controller = container.resolve(DashboardCampaignSummaryController);
  const { authenticateUser } = options.authMiddleware;

  fastify.get(
    '/:slug',
    {
      preHandler: authenticateUser,
      schema: {
        description: 'Get dashboard campaign summary by campaign slug',
        tags: ['Dashboard Campaign Summary'],
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
