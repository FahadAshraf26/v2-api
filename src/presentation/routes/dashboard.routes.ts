import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { AuthMiddleware } from '@/shared/utils/middleware/auth.middleware';

import { DashboardController } from '../controllers/dashboard.controller';

export default async function dashboardRoutes(
  fastify: FastifyInstance,
  options: { authMiddleware: AuthMiddleware }
): Promise<void> {
  const controller = container.resolve(DashboardController);

  fastify.post(
    '/save-changes',
    {
      preHandler: [options.authMiddleware.authenticateUser],
    },
    controller.saveChanges.bind(controller)
  );
}
