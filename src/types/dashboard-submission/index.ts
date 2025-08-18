export interface SubmitForReviewDto {
  campaignId: string;
  userId: string;
  entityTypes: string[];
}

export interface ReviewSubmissionDto {
  campaignId: string;
  adminId: string;
  entityTypes: (
    | 'dashboard-campaign-info'
    | 'dashboard-campaign-summary'
    | 'dashboard-socials'
  )[];
  action: 'approve' | 'reject';
  comment?: string;
}

export const submitForReviewSchema = {
  type: 'object',
  properties: {
    campaignId: { type: 'string', format: 'uuid' },
    userId: { type: 'string' },
    entityTypes: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['campaignId', 'userId', 'entityTypes'],
};

export const reviewSubmissionSchema = {
  type: 'object',
  properties: {
    campaignId: { type: 'string', format: 'uuid' },
    adminId: { type: 'string' },
    entityTypes: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'dashboard-campaign-info',
          'dashboard-campaign-summary',
          'dashboard-socials',
        ],
      },
    },
    action: { type: 'string', enum: ['approve', 'reject'] },
    comment: { type: 'string' },
  },
  required: ['campaignId', 'adminId', 'entityTypes', 'action'],
};

export const successResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
  },
};

export const errorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
  },
};
