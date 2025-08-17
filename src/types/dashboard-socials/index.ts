import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import { DashboardApprovalProps } from '@/types/approval';

export interface DashboardSocialsModelAttributes {
  id: string;
  campaignId: string;
  linkedIn?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  yelp?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface DashboardSocialsProps {
  id: string;
  campaignId: string;
  linkedIn?: string | undefined;
  twitter?: string | undefined;
  instagram?: string | undefined;
  facebook?: string | undefined;
  tiktok?: string | undefined;
  yelp?: string | undefined;
  status: ApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date | undefined;
  reviewedAt?: Date | undefined;
  submittedBy?: string | undefined;
  reviewedBy?: string | undefined;
  comment?: string | undefined;
}

/**
 * Combined entity with approval data (from repository join)
 */
export interface DashboardSocialsWithApproval {
  socials: DashboardSocialsModelAttributes;
  approval?: DashboardApprovalProps;
}

export interface CreateDashboardSocialsDto {
  campaignId: string;
  linkedIn?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  yelp?: string;
}

export interface UpdateDashboardSocialsDto {
  linkedIn?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  yelp?: string;
}

export interface ReviewDashboardSocialsDto {
  action: 'approve' | 'reject';
  comment?: string;
  adminId: string;
}

export interface CreateDashboardSocialsRequest {
  Body: CreateDashboardSocialsDto;
}

export interface UpdateDashboardSocialsRequest {
  Params: { id: string };
  Body: UpdateDashboardSocialsDto;
}

export interface GetDashboardSocialsRequest {
  Params: { id: string };
}

export interface GetByCampaignIdRequest {
  Params: { campaignId: string };
}

export interface GetByCampaignSlugRequest {
  Params: { campaignSlug: string };
}

export interface SubmitDashboardSocialsRequest {
  Params: { id: string };
}

export interface ReviewDashboardSocialsRequest {
  Params: { id: string };
  Body: Omit<ReviewDashboardSocialsDto, 'adminId'>;
}

export const dashboardSocialsSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    campaignId: { type: 'string', format: 'uuid' },
    linkedIn: { type: 'string', nullable: true },
    twitter: { type: 'string', nullable: true },
    instagram: { type: 'string', nullable: true },
    facebook: { type: 'string', nullable: true },
    tiktok: { type: 'string', nullable: true },
    yelp: { type: 'string', nullable: true },
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

export const createDashboardSocialsSchema = {
  type: 'object',
  required: ['campaignId'],
  properties: {
    campaignId: { type: 'string', format: 'uuid' },
    linkedIn: { type: 'string', minLength: 1 },
    twitter: { type: 'string', minLength: 1 },
    instagram: { type: 'string', minLength: 1 },
    facebook: { type: 'string', minLength: 1 },
    tiktok: { type: 'string', minLength: 1 },
    yelp: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const;

export const updateDashboardSocialsSchema = {
  type: 'object',
  properties: {
    linkedIn: { type: 'string', minLength: 1 },
    twitter: { type: 'string', minLength: 1 },
    instagram: { type: 'string', minLength: 1 },
    facebook: { type: 'string', minLength: 1 },
    tiktok: { type: 'string', minLength: 1 },
    yelp: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const;

export const reviewDashboardSocialsSchema = {
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
    data: dashboardSocialsSchema,
    message: { type: 'string' },
  },
} as const;

export const listResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: dashboardSocialsSchema,
    },
    count: { type: 'number' },
  },
} as const;
