import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { container } from 'tsyringe';

import { DashboardSocialsController } from '@/presentation/controllers/dashboard-socials.controller';

import {
  authenticateAdmin,
  authenticateUser,
  authenticateUserOrAdmin,
} from '@/shared/utils/middleware/auth.middleware';

import {
  createDashboardSocialsSchema,
  dashboardSocialsSchema,
  errorSchema,
  listResponseSchema,
  reviewDashboardSocialsSchema,
  successResponseSchema,
  updateDashboardSocialsSchema,
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
        description: 'Create new dashboard socials',
        tags: ['Dashboard Socials'],
        security: [{ bearerAuth: [] }],
        body: createDashboardSocialsSchema,
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
        description: 'Update dashboard socials (only if pending or rejected)',
        tags: ['Dashboard Socials'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        body: updateDashboardSocialsSchema,
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
        description: 'Submit dashboard socials for admin review',
        tags: ['Dashboard Socials'],
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
          'Review dashboard socials (approve or reject) - Admin only',
        tags: ['Dashboard Socials - Admin'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        body: reviewDashboardSocialsSchema,
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
        description: 'Get dashboard socials by ID',
        tags: ['Dashboard Socials'],
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
              data: dashboardSocialsSchema,
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
        description: 'Get dashboard socials by campaign ID',
        tags: ['Dashboard Socials'],
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
              data: dashboardSocialsSchema,
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
        description: 'Get dashboard socials by campaign slug',
        tags: ['Dashboard Socials'],
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
              data: dashboardSocialsSchema,
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
        description: 'Get all pending dashboard socials for admin review',
        tags: ['Dashboard Socials - Admin'],
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
        description: "Get current user's dashboard socials submissions",
        tags: ['Dashboard Socials'],
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
    '/admin/statistics',
    {
      preHandler: authenticateAdmin,
      schema: {
        description: 'Get dashboard socials statistics - Admin only',
        tags: ['Dashboard Socials - Admin'],
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
