import { ApprovalStatus } from '@/shared/enums/dashboard-campaign-info.enums';

/**
 * Base properties for entities that follow an approval workflow
 */
export interface BaseApprovalProps {
  id: string;
  campaignId: string;
  status: ApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  submittedBy?: string;
  reviewedBy?: string;
  comment?: string;
}

/**
 * Base model attributes for approval workflow (persistence layer)
 */
export interface BaseApprovalModelAttributes {
  id: string;
  campaignId: string;
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date | null;
  reviewedAt?: Date | null;
  submittedBy?: string | null;
  reviewedBy?: string | null;
  comment?: string | null;
}

/**
 * Base DTO for reviewing entities (approve/reject)
 */
export interface BaseReviewDto {
  action: 'approve' | 'reject';
  comment?: string;
  adminId: string;
}

/**
 * Base request types for approval workflow
 */
export interface BaseSubmitRequest {
  Params: { id: string };
}

export interface BaseGetByIdRequest {
  Params: { id: string };
}

export interface BaseGetByCampaignIdRequest {
  Params: { campaignId: string };
}

export interface BaseReviewRequest {
  Params: { id: string };
  Body: Omit<BaseReviewDto, 'adminId'>;
}

/**
 * Base response schemas for approval workflow
 */
export const baseErrorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
  },
} as const;

export const baseSuccessResponseSchema = (dataSchema: any) =>
  ({
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: dataSchema,
      message: { type: 'string' },
    },
  }) as const;

export const baseListResponseSchema = (itemSchema: any) =>
  ({
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: {
        type: 'array',
        items: itemSchema,
      },
      count: { type: 'number' },
    },
  }) as const;

export const baseReviewSchema = {
  type: 'object',
  required: ['action'],
  properties: {
    action: { type: 'string', enum: ['approve', 'reject'] },
    comment: { type: 'string' },
  },
  additionalProperties: false,
} as const;
