import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { DashboardSubmissionController } from '@/presentation/controllers/dashboard-submission.controller';

import { AuthMiddleware } from '@/shared/utils/middleware/auth.middleware';

import {
  errorSchema,
  submitForReviewSchema,
  successResponseSchema,
} from '@/types/dashboard-submission';

export default async function dashboardSubmissionRoutes(
  fastify: FastifyInstance,
  options: { authMiddleware: AuthMiddleware }
): Promise<void> {
  const controller = container.resolve<DashboardSubmissionController>(
    TOKENS.DashboardSubmissionControllerToken
  );
  const { authenticateUser } = options.authMiddleware;

  fastify.post(
    '/submit',
    {
      preHandler: authenticateUser,
      schema: {
        description: 'Submit dashboard items for admin review',
        tags: ['Dashboard Submission'],
        security: [{ bearerAuth: [] }],
        body: submitForReviewSchema,
        response: {
          200: successResponseSchema,
          400: errorSchema,
          401: errorSchema,
          404: errorSchema,
          409: errorSchema,
          500: errorSchema,
        },
      },
    },
    controller.submitForReview.bind(controller)
  );
}
