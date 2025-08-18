import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { CampaignController } from '@/presentation/controllers/campaign.controller';

import { authenticateAdmin } from '@/shared/utils/middleware/auth.middleware';

import { getPendingCampaignsSchema } from '@/types/campaign/get-pending-campaigns.dto';

export default async function campaignRoutes(
  fastify: FastifyInstance
): Promise<void> {
  const controller = container.resolve(CampaignController);

  fastify.get(
    '/pending',
    {
      preHandler: authenticateAdmin,
      schema: {
        description: 'Get pending campaigns with filters and pagination',
        tags: ['Campaigns - Admin'],
        security: [{ bearerAuth: [] }],
        querystring: getPendingCampaignsSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    campaignName: { type: 'string' },
                    campaignStage: { type: 'string' },
                    submittedBy: { type: 'string' },
                    submittedAt: { type: 'string', format: 'date-time' },
                    status: { type: 'string' },
                  },
                },
              },
              total: { type: 'number' },
              page: { type: 'number' },
              perPage: { type: 'number' },
              totalPages: { type: 'number' },
            },
          },
        },
      },
    },
    controller.getPendingCampaigns.bind(controller)
  );
}
