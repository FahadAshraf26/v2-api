import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { container } from 'tsyringe';
import { DashboardCampaignInfoController } from '@/presentation/controllers/dashboard-campaign-info.controller';
import {
  authenticateUser,
  authenticateAdmin,
  authenticateUserOrAdmin,
} from '@/infrastructure/middleware/auth.middleware';
import {
  createDashboardCampaignInfoSchema,
  dashboardCampaignInfoSchema,
  errorSchema,
  listResponseSchema,
  reviewDashboardCampaignInfoSchema,
  successResponseSchema,
  updateDashboardCampaignInfoSchema,
} from '@/types/dashboard-campaign-info';

export default async function dashboardCampaignInfoRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const controller = container.resolve(DashboardCampaignInfoController);

  fastify.post(
    '/',
    {
      preHandler: authenticateUser,
      schema: {
        description: 'Create new dashboard campaign info',
        tags: ['Dashboard Campaign Info'],
        security: [{ bearerAuth: [] }],
        body: createDashboardCampaignInfoSchema,
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
          'Update dashboard campaign info (only if pending or rejected)',
        tags: ['Dashboard Campaign Info'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        body: updateDashboardCampaignInfoSchema,
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
        description: 'Submit dashboard campaign info for admin review',
        tags: ['Dashboard Campaign Info'],
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
          'Review dashboard campaign info (approve or reject) - Admin only',
        tags: ['Dashboard Campaign Info - Admin'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        body: reviewDashboardCampaignInfoSchema,
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
        description: 'Get dashboard campaign info by ID',
        tags: ['Dashboard Campaign Info'],
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
              data: dashboardCampaignInfoSchema,
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
        description: 'Get dashboard campaign info by campaign ID',
        tags: ['Dashboard Campaign Info'],
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
              data: dashboardCampaignInfoSchema,
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
    '/admin/pending',
    {
      preHandler: authenticateAdmin,
      schema: {
        description:
          'Get all pending dashboard campaign infos for admin review',
        tags: ['Dashboard Campaign Info - Admin'],
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
        description: "Get current user's dashboard campaign info submissions",
        tags: ['Dashboard Campaign Info'],
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
}
