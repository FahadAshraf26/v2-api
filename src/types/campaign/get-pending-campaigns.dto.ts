import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

export interface GetPendingCampaignsDto {
  page?: number;
  perPage?: number;
  searchTerm?: string;
  campaignStage?: string;
}

export const getPendingCampaignsSchema = {
  type: 'object',
  properties: {
    page: { type: 'number', minimum: 1, default: 1 },
    perPage: { type: 'number', minimum: 1, maximum: 100, default: 10 },
    searchTerm: { type: 'string' },
    campaignStage: { type: 'string' },
  },
};

export interface PendingCampaignDto {
  campaignName: string;
  campaignStage: string | null;
  submittedBy: string | null;
  submittedAt: Date | null;
  status: string;
}
