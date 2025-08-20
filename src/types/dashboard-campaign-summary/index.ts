import { ApprovalStatus } from '@/shared/enums/dashboard-campaign-info.enums';

/**
 * Dashboard Campaign Summary model attributes (persistence layer - business data only)
 */
export interface DashboardCampaignSummaryModelAttributes {
  id: string;
  campaignId: string;
  summary?: string | null;
  tagLine?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dashboard Campaign Summary domain properties (includes approval data from join)
 */
export interface DashboardCampaignSummaryProps {
  id: string;
  campaignId: string;
  summary?: string | null;
  tagLine?: string | null;
  status: ApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardCampaignSummaryDto {
  id: string;
  campaignId: string;
  summary?: string | null;
  tagLine?: string | null;
  status: ApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Combined entity with approval data (from repository join)
 */
export interface DashboardCampaignSummaryWithApproval {
  summary: DashboardCampaignSummaryModelAttributes;
  approval?: any;
}

/**
 * DTOs for dashboard campaign summary operations
 */
export interface CreateDashboardCampaignSummaryDto {
  campaignId: string;
  summary?: string;
  tagLine?: string;
}

export interface UpdateDashboardCampaignSummaryDto {
  campaignId: string;
  summary?: string;
  tagLine?: string;
}

export interface ReviewDashboardCampaignSummaryDto {
  action: 'approve' | 'reject';
  comment?: string;
  adminId: string;
}

/**
 * Request types
 */
export interface CreateDashboardCampaignSummaryRequest {
  Body: CreateDashboardCampaignSummaryDto;
}

export interface UpdateDashboardCampaignSummaryRequest {
  Params: { id: string };
  Body: UpdateDashboardCampaignSummaryDto;
}

export interface GetDashboardCampaignSummaryRequest {
  Params: { id: string };
}

export interface GetByCampaignIdRequest {
  Params: { campaignId: string };
}

export interface GetByCampaignSlugRequest {
  Params: { campaignSlug: string };
}

export interface SubmitDashboardCampaignSummaryRequest {
  Params: { id: string };
}

export interface ReviewDashboardCampaignSummaryRequest {
  Params: { id: string };
  Body: Omit<ReviewDashboardCampaignSummaryDto, 'adminId'>;
}

/**
 * JSON Schemas for validation
 */
export const dashboardCampaignSummarySchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    campaignId: { type: 'string', format: 'uuid' },
    summary: { type: 'string', nullable: true },
    tagLine: { type: 'string', nullable: true },
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

export const createDashboardCampaignSummarySchema = {
  type: 'object',
  required: ['campaignId'],
  properties: {
    campaignId: { type: 'string', format: 'uuid' },
    summary: { type: 'string', minLength: 1 },
    tagLine: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const;

export const updateDashboardCampaignSummarySchema = {
  type: 'object',
  properties: {
    summary: { type: 'string', minLength: 1 },
    tagLine: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const;

export const reviewDashboardCampaignSummarySchema = {
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
    data: dashboardCampaignSummarySchema,
    message: { type: 'string' },
  },
} as const;

export const listResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: dashboardCampaignSummarySchema,
    },
    count: { type: 'number' },
  },
} as const;
