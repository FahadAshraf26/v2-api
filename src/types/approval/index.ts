import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

export interface SubmittedItems {
  dashboardCampaignInfo: boolean;
  dashboardCampaignSummary: boolean;
  dashboardSocials: boolean;
}

export type ApprovalStatusType = 'pending' | 'approved' | 'rejected';

export interface DashboardApprovalProps {
  id: string;
  campaignId: string;
  submittedItems: SubmittedItems;
  status: ApprovalStatusType;
  submittedAt?: Date;
  reviewedAt?: Date;
  submittedBy?: string;
  reviewedBy?: string;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardApprovalModelAttributes {
  id: string;
  campaignId: string;
  submittedItems: SubmittedItems;
  status: ApprovalStatusType;
  submittedAt?: Date | null;
  reviewedAt?: Date | null;
  submittedBy?: string | null;
  reviewedBy?: string | null;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// src/types/submission/index.ts
export interface SubmissionProps {
  id: string;
  campaignId: string;
  submittedBy: string;
  items: {
    dashboardCampaignInfo?: boolean;
    dashboardCampaignSummary?: boolean;
    dashboardSocials?: boolean;
  };
  submissionNote?: string;
  status: 'pending' | 'completed' | 'failed';
  results?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubmissionProps {
  campaignId: string;
  submittedBy: string;
  items: {
    dashboardCampaignInfo?: boolean;
    dashboardCampaignSummary?: boolean;
    dashboardSocials?: boolean;
  };
  submissionNote?: string;
}
