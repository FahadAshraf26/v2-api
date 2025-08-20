import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { DashboardReviewController } from '@/presentation/controllers/dashboard-review.controller';

import { AuthMiddleware } from '@/shared/utils/middleware/auth.middleware';

import {
  errorSchema,
  reviewSubmissionSchema,
  successResponseSchema,
} from '@/types/dashboard-submission';

export default async function dashboardReviewRoutes(
  fastify: FastifyInstance,
  options: { authMiddleware: AuthMiddleware }
): Promise<void> {
  const controller = container.resolve<DashboardReviewController>(
    TOKENS.DashboardReviewControllerToken
  );
  const { authenticateAdmin } = options.authMiddleware;

  fastify.post(
    '/review',
    {
      preHandler: authenticateAdmin,
      schema: {
        description:
          'Review dashboard submission (approve or reject) - Admin only',
        tags: ['Dashboard Review - Admin'],
        security: [{ bearerAuth: [] }],
        body: reviewSubmissionSchema,
        response: {
          200: successResponseSchema,
          400: errorSchema,
          403: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    controller.reviewSubmission.bind(controller)
  );
}
