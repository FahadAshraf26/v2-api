import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { container } from 'tsyringe';

import { DashboardSubmissionController } from '@/presentation/controllers/dashboard-submission.controller';

import { authenticateUser } from '@/shared/utils/middleware/auth.middleware';

import {
  dashboardSubmissionSchema,
  errorSchema,
} from '@/types/dashboard-submission';

export default async function dashboardSubmissionRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const controller = container.resolve(DashboardSubmissionController);

  // Submit multiple dashboard entities for review
  fastify.post(
    '/submit',
    {
      preHandler: authenticateUser,
      schema: {
        description:
          'Submit multiple dashboard entities for review with notifications',
        tags: ['Dashboard Submission'],
        security: [{ bearerAuth: [] }],
        body: dashboardSubmissionSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              submissionId: { type: 'string' },
              results: {
                type: 'object',
                properties: {
                  dashboardCampaignInfo: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      entityId: { type: 'string' },
                      error: { type: 'string' },
                    },
                  },
                  dashboardCampaignSummary: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      entityId: { type: 'string' },
                      error: { type: 'string' },
                    },
                  },
                  dashboardSocials: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      entityId: { type: 'string' },
                      error: { type: 'string' },
                    },
                  },
                },
              },
              notifications: {
                type: 'object',
                properties: {
                  slack: {
                    type: 'object',
                    properties: {
                      sent: { type: 'boolean' },
                      error: { type: 'string' },
                    },
                    required: ['sent'],
                  },
                  email: {
                    type: 'object',
                    properties: {
                      sent: { type: 'boolean' },
                      recipients: {
                        type: 'array',
                        items: { type: 'string' },
                      },
                      error: { type: 'string' },
                    },
                    required: ['sent', 'recipients'],
                  },
                },
                required: ['slack', 'email'],
              },
            },
            required: ['success', 'submissionId', 'results', 'notifications'],
          },
          400: errorSchema,
          401: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    (req, reply) => controller.submitForReview(req as any, reply)
  );

  // Test notification services (admin endpoint)
  fastify.get(
    '/test-notifications',
    {
      preHandler: authenticateUser,
      schema: {
        description: 'Test Slack and email notification services',
        tags: ['Dashboard Submission'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  results: {
                    type: 'object',
                    properties: {
                      slack: { type: 'boolean' },
                      email: { type: 'boolean' },
                    },
                    required: ['slack', 'email'],
                  },
                },
                required: ['message', 'results'],
              },
            },
            required: ['success', 'data'],
          },
          401: errorSchema,
          500: errorSchema,
        },
      },
    },
    (req, reply) => controller.testNotifications(req as any, reply)
  );
}
