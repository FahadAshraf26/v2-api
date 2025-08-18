import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { container } from 'tsyringe';

import { DashboardSocialsController } from '@/presentation/controllers/dashboard-socials.controller';

import { authenticateUser } from '@/shared/utils/middleware/auth.middleware';

import {
  createDashboardSocialsSchema,
  errorSchema,
  successResponseSchema,
} from '@/types/dashboard-socials';

export default async function dashboardSocialsRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const controller = container.resolve(DashboardSocialsController);

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
