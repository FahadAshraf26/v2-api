import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { container } from 'tsyringe';

import { DashboardCampaignSummaryController } from '@/presentation/controllers/dashboard-campaign-summary.controller';

import {
  authenticateAdmin,
  authenticateUser,
  authenticateUserOrAdmin,
} from '@/shared/utils/middleware/auth.middleware';

import {
  createDashboardCampaignSummarySchema,
  dashboardCampaignSummarySchema,
  errorSchema,
  listResponseSchema,
  reviewDashboardCampaignSummarySchema,
  successResponseSchema,
  updateDashboardCampaignSummarySchema,
} from '@/types/dashboard-campaign-summary';

export default async function dashboardCampaignSummaryRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const controller = container.resolve(DashboardCampaignSummaryController);

  fastify.post(
    '/',
    {
      preHandler: authenticateUser,
      schema: {
        description: 'Create new dashboard campaign summary',
        tags: ['Dashboard Campaign Summary'],
        security: [{ bearerAuth: [] }],
        body: createDashboardCampaignSummarySchema,
        response: {
          201: successResponseSchema,
          400: errorSchema,
          401: errorSchema,
          409: errorSchema,
          500: errorSchema,
        },
      },
    },
    (req, reply) => controller.create(req as any, reply)
  );

  fastify.put(
    '/:id',
    {
      preHandler: authenticateUser,
      schema: {
        description:
          'Update dashboard campaign summary (only if pending or rejected)',
        tags: ['Dashboard Campaign Summary'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        body: updateDashboardCampaignSummarySchema,
        response: {
          200: successResponseSchema,
          400: errorSchema,
          401: errorSchema,
          403: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    (req, reply) => controller.update(req as any, reply)
  );

  fastify.post(
    '/:id/submit',
    {
      preHandler: authenticateUser,
      schema: {
        description: 'Submit dashboard campaign summary for admin review',
        tags: ['Dashboard Campaign Summary'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
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
    (req, reply) => controller.submit(req as any, reply)
  );

  fastify.post(
    '/:id/review',
    {
      preHandler: authenticateAdmin,
      schema: {
        description:
          'Review dashboard campaign summary (approve or reject) - Admin only',
        tags: ['Dashboard Campaign Summary - Admin'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        body: reviewDashboardCampaignSummarySchema,
        response: {
          200: successResponseSchema,
          400: errorSchema,
          403: errorSchema,
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    (req, reply) => controller.review(req as any, reply)
  );

  fastify.get(
    '/:id',
    {
      preHandler: authenticateUserOrAdmin,
      schema: {
        description: 'Get dashboard campaign summary by ID',
        tags: ['Dashboard Campaign Summary'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: dashboardCampaignSummarySchema,
            },
          },
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    (req, reply) => controller.getById(req as any, reply)
  );

  fastify.get(
    '/campaign/:campaignId',
    {
      preHandler: authenticateUserOrAdmin,
      schema: {
        description: 'Get dashboard campaign summary by campaign ID',
        tags: ['Dashboard Campaign Summary'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            campaignId: { type: 'string', format: 'uuid' },
          },
          required: ['campaignId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: dashboardCampaignSummarySchema,
            },
          },
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    (req, reply) => controller.getByCampaignId(req as any, reply)
  );

  fastify.get(
    '/campaign/slug/:campaignSlug',
    {
      preHandler: authenticateUserOrAdmin,
      schema: {
        description: 'Get dashboard campaign summary by campaign slug',
        tags: ['Dashboard Campaign Summary'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            campaignSlug: { type: 'string' },
          },
          required: ['campaignSlug'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: dashboardCampaignSummarySchema,
            },
          },
          404: errorSchema,
          500: errorSchema,
        },
      },
    },
    (req, reply) => controller.getByCampaignSlug(req as any, reply)
  );

  fastify.get(
    '/admin/pending',
    {
      preHandler: authenticateAdmin,
      schema: {
        description:
          'Get all pending dashboard campaign summaries for admin review',
        tags: ['Dashboard Campaign Summary - Admin'],
        security: [{ bearerAuth: [] }],
        response: {
          200: listResponseSchema,
          403: errorSchema,
          500: errorSchema,
        },
      },
    },
    (req, reply) => controller.getPendingForReview(req as any, reply)
  );

  fastify.get(
    '/user/my-submissions',
    {
      preHandler: authenticateUser,
      schema: {
        description:
          "Get current user's dashboard campaign summary submissions",
        tags: ['Dashboard Campaign Summary'],
        security: [{ bearerAuth: [] }],
        response: {
          200: listResponseSchema,
          401: errorSchema,
          500: errorSchema,
        },
      },
    },
    (req, reply) => controller.getMySubmissions(req as any, reply)
  );

  fastify.get(
    '/approved',
    {
      preHandler: authenticateUserOrAdmin,
      schema: {
        description: 'Get all approved dashboard campaign summaries',
        tags: ['Dashboard Campaign Summary'],
        security: [{ bearerAuth: [] }],
        response: {
          200: listResponseSchema,
          500: errorSchema,
        },
      },
    },
    (req, reply) => controller.getApproved(req as any, reply)
  );

  fastify.get(
    '/admin/statistics',
    {
      preHandler: authenticateAdmin,
      schema: {
        description: 'Get dashboard campaign summary statistics - Admin only',
        tags: ['Dashboard Campaign Summary - Admin'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  pending: { type: 'number' },
                  approved: { type: 'number' },
                  rejected: { type: 'number' },
                },
              },
            },
          },
          403: errorSchema,
          500: errorSchema,
        },
      },
    },
    (req, reply) => controller.getStatistics(req as any, reply)
  );
}
