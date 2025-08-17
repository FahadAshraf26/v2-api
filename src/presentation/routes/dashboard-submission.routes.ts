import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { container } from 'tsyringe';

import { DashboardSubmissionController } from '@/presentation/controllers/dashboard-submission.controller';

import {
  authenticateAdmin,
  authenticateUser,
} from '@/shared/utils/middleware/auth.middleware';

export default async function dashboardSubmissionRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  const controller = container.resolve(DashboardSubmissionController);

  // Submit dashboard items for review
  fastify.post(
    '/submit',
    {
      preHandler: authenticateUser,
      schema: {
        description:
          'Submit dashboard items for review (one approval per campaign)',
        tags: ['Dashboard Submission'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['campaignId', 'items'],
          properties: {
            campaignId: { type: 'string', format: 'uuid' },
            items: {
              type: 'object',
              properties: {
                dashboardCampaignInfo: { type: 'boolean' },
                dashboardCampaignSummary: { type: 'boolean' },
                dashboardSocials: { type: 'boolean' },
              },
              additionalProperties: false,
            },
            submissionNote: { type: 'string' },
          },
          additionalProperties: false,
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  submissionId: { type: 'string' },
                  approvalId: { type: 'string' },
                  status: { type: 'string', enum: ['completed', 'failed'] },
                  submittedItems: {
                    type: 'object',
                    properties: {
                      dashboardCampaignInfo: { type: 'boolean' },
                      dashboardCampaignSummary: { type: 'boolean' },
                      dashboardSocials: { type: 'boolean' },
                    },
                  },
                  message: { type: 'string' },
                },
                required: [
                  'submissionId',
                  'approvalId',
                  'status',
                  'submittedItems',
                ],
              },
            },
            required: ['success', 'data'],
          },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          409: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    (req, reply) => controller.submitForReview(req as any, reply)
  );

  // Get approval status for campaign
  fastify.get(
    '/status/:campaignId',
    {
      preHandler: authenticateUser,
      schema: {
        description: 'Get approval status for a campaign',
        tags: ['Dashboard Submission'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['campaignId'],
          properties: {
            campaignId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    (req, reply) => controller.getApprovalStatus(req as any, reply)
  );

  // Admin: Get pending approvals
  fastify.get(
    '/admin/pending',
    {
      preHandler: authenticateAdmin,
      schema: {
        description: 'Get all pending approvals for admin review',
        tags: ['Dashboard Submission - Admin'],
        security: [{ bearerAuth: [] }],
      },
    },
    (req, reply) => controller.getPendingForReview(req as any, reply)
  );

  // Admin: Review approval
  fastify.post(
    '/admin/:campaignId/review',
    {
      preHandler: authenticateAdmin,
      schema: {
        description: 'Review approval (approve or reject) - Admin only',
        tags: ['Dashboard Submission - Admin'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['campaignId'],
          properties: {
            campaignId: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          required: ['action'],
          properties: {
            action: { type: 'string', enum: ['approve', 'reject'] },
            comment: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    (req, reply) => controller.reviewApproval(req as any, reply)
  );

  // Admin: Get statistics
  fastify.get(
    '/admin/statistics',
    {
      preHandler: authenticateAdmin,
      schema: {
        description: 'Get approval statistics - Admin only',
        tags: ['Dashboard Submission - Admin'],
        security: [{ bearerAuth: [] }],
      },
    },
    (req, reply) => controller.getStatistics(req as any, reply)
  );
}
