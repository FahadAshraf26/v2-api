import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { DashboardOwnersController } from '@/presentation/controllers/dashboard-owners.controller';

import { AuthMiddleware } from '@/shared/utils/middleware/auth.middleware';

export default async function dashboardOwnersRoutes(
  fastify: FastifyInstance,
  options: { authMiddleware: AuthMiddleware }
): Promise<void> {
  const controller = container.resolve(DashboardOwnersController);
  const { authenticateUser } = options.authMiddleware;

  fastify.get(
    '/:slug',
    {
      preHandler: authenticateUser,
      schema: {
        description: 'Get dashboard owners by campaign slug',
        tags: ['Dashboard Owners'],
        params: {
          type: 'object',
          properties: {
            slug: { type: 'string' },
          },
          required: ['slug'],
        },
        response: {
          200: {},
          404: {},
          500: {},
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
        description: 'Create or update dashboard owners',
        tags: ['Dashboard Owners'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            campaignId: { type: 'string' },
            owners: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  position: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        response: {
          200: {},
          201: {},
          400: {},
          401: {},
          409: {},
          500: {},
        },
      },
    },
    controller.createOrUpdate.bind(controller)
  );
}
