import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { DashboardSocialsController } from '@/presentation/controllers/dashboard-socials.controller';

import { AuthMiddleware } from '@/shared/utils/middleware/auth.middleware';

import {
  createDashboardSocialsSchema,
  errorSchema,
  successResponseSchema,
} from '@/types/dashboard-socials';

export default async function dashboardSocialsRoutes(
  fastify: FastifyInstance,
  options: { authMiddleware: AuthMiddleware }
): Promise<void> {
  const controller = container.resolve(DashboardSocialsController);
  const { authenticateUser } = options.authMiddleware;

  fastify.get(
    '/:slug',
    {
      preHandler: authenticateUser,
      schema: {
        description: 'Get dashboard socials by campaign slug',
        tags: ['Dashboard Socials'],
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
        description: 'Create or update dashboard socials',
        tags: ['Dashboard Socials'],
        security: [{ bearerAuth: [] }],
        body: createDashboardSocialsSchema, // Can be used for both create and update
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
