export interface DashboardSubmissionRequest {
  campaignId: string;
  entities: {
    dashboardCampaignInfo?: boolean;
    dashboardCampaignSummary?: boolean;
    dashboardSocials?: boolean;
  };
  submissionNote?: string;
}

export interface DashboardSubmissionResponse {
  success: boolean;
  submissionId: string;
  results: {
    dashboardCampaignInfo?: {
      success: boolean;
      entityId?: string;
      error?: string;
    };
    dashboardCampaignSummary?: {
      success: boolean;
      entityId?: string;
      error?: string;
    };
    dashboardSocials?: {
      success: boolean;
      entityId?: string;
      error?: string;
    };
  };
  notifications: {
    slack: {
      sent: boolean;
      error?: string;
    };
    email: {
      sent: boolean;
      recipients: string[];
      error?: string;
    };
  };
}

export interface NotificationData {
  campaignId: string;
  campaignName?: string;
  submittedBy: string;
  submittedEntities: string[];
  submissionNote?: string;
  submissionId: string;
  timestamp: Date;
}

export interface EmailRecipient {
  email: string;
  name?: string;
  role: 'admin' | 'owner';
}

export const dashboardSubmissionSchema = {
  type: 'object',
  required: ['campaignId', 'entities'],
  properties: {
    campaignId: { type: 'string', format: 'uuid' },
    entities: {
      type: 'object',
      properties: {
        dashboardCampaignInfo: { type: 'boolean' },
        dashboardCampaignSummary: { type: 'boolean' },
        dashboardSocials: { type: 'boolean' },
      },
      additionalProperties: false,
      minProperties: 1,
    },
    submissionNote: { type: 'string', maxLength: 500 },
  },
  additionalProperties: false,
} as const;

export const errorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number' },
    code: { type: 'string' },
    message: { type: 'string' },
    timestamp: { type: 'string' },
    requestId: { type: 'string' },
  },
} as const;
