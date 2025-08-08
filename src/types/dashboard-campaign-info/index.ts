import { ApprovalStatus } from '@/shared/enums/dashboard-campaign-info.enums';

export interface DashboardCampaignInfoModelAttributes {
  id: string;
  campaignId: string;
  milestones: string;
  investorPitch: string;
  isShowPitch: boolean;
  investorPitchTitle: string;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date | null;
  reviewedAt?: Date | null;
  submittedBy?: string | null;
  reviewedBy?: string | null;
  comment?: string | null;
}

export interface DashboardCampaignInfoProps {
  id: string;
  campaignId: string;
  milestones: string;
  investorPitch: string;
  isShowPitch: boolean;
  investorPitchTitle: string;
  status: ApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  submittedBy?: string;
  reviewedBy?: string;
  comment?: string;
}

export interface CreateDashboardCampaignInfoDto {
  campaignId: string;
  milestones: string;
  investorPitch: string;
  isShowPitch: boolean;
  investorPitchTitle: string;
}

export interface UpdateDashboardCampaignInfoDto {
  milestones?: string;
  investorPitch?: string;
  isShowPitch?: boolean;
  investorPitchTitle?: string;
}

export interface ReviewDashboardCampaignInfoDto {
  action: 'approve' | 'reject';
  comment?: string;
  adminId: string;
}

export interface CreateDashboardCampaignInfoRequest {
  Body: CreateDashboardCampaignInfoDto;
}

export interface UpdateDashboardCampaignInfoRequest {
  Params: { id: string };
  Body: UpdateDashboardCampaignInfoDto;
}

export interface GetDashboardCampaignInfoRequest {
  Params: { id: string };
}

export interface GetByCampaignIdRequest {
  Params: { campaignId: string };
}

export interface SubmitDashboardCampaignInfoRequest {
  Params: { id: string };
}

export interface ReviewDashboardCampaignInfoRequest {
  Params: { id: string };
  Body: Omit<ReviewDashboardCampaignInfoDto, 'adminId'>;
}

export const dashboardCampaignInfoSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    campaignId: { type: 'string', format: 'uuid' },
    milestones: { type: 'string' },
    investorPitch: { type: 'string' },
    isShowPitch: { type: 'boolean' },
    investorPitchTitle: { type: 'string' },
    status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    submittedAt: { type: 'string', format: 'date-time', nullable: true },
    reviewedAt: { type: 'string', format: 'date-time', nullable: true },
    submittedBy: { type: 'string', format: 'uuid', nullable: true },
    reviewedBy: { type: 'string', format: 'uuid', nullable: true },
    comment: { type: 'string', nullable: true },
  },
} as const;

export const createDashboardCampaignInfoSchema = {
  type: 'object',
  required: [
    'campaignId',
    'milestones',
    'investorPitch',
    'isShowPitch',
    'investorPitchTitle',
  ],
  properties: {
    campaignId: { type: 'string', format: 'uuid' },
    milestones: { type: 'string', minLength: 1 },
    investorPitch: { type: 'string', minLength: 1 },
    isShowPitch: { type: 'boolean' },
    investorPitchTitle: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const;

export const updateDashboardCampaignInfoSchema = {
  type: 'object',
  properties: {
    milestones: { type: 'string', minLength: 1 },
    investorPitch: { type: 'string', minLength: 1 },
    isShowPitch: { type: 'boolean' },
    investorPitchTitle: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const;

export const reviewDashboardCampaignInfoSchema = {
  type: 'object',
  required: ['action'],
  properties: {
    action: { type: 'string', enum: ['approve', 'reject'] },
    comment: { type: 'string' },
  },
  additionalProperties: false,
} as const;

export const errorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
  },
} as const;

export const successResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: dashboardCampaignInfoSchema,
    message: { type: 'string' },
  },
} as const;

export const listResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: dashboardCampaignInfoSchema,
    },
    count: { type: 'number' },
  },
} as const;
