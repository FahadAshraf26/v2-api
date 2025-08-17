import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

/**
 * Types of entities that can be approved
 */
export type EntityType =
  | 'dashboard-campaign-summary'
  | 'dashboard-campaign-info'
  | 'dashboard-socials';

/**
 * Simplified approval status type
 */
export type ApprovalStatusType = 'pending' | 'approved' | 'rejected';

/**
 * Dashboard Approval domain properties
 */
export interface DashboardApprovalProps {
  id: string;
  entityType: EntityType;
  entityId: string;
  campaignId: string;
  status: ApprovalStatusType;
  submittedAt?: Date;
  reviewedAt?: Date;
  submittedBy?: string;
  reviewedBy?: string;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dashboard Approval model attributes (persistence layer)
 */
export interface DashboardApprovalModelAttributes {
  id: string;
  entityType: EntityType;
  entityId: string;
  campaignId: string;
  status: ApprovalStatusType;
  submittedAt?: Date | null;
  reviewedAt?: Date | null;
  submittedBy?: string | null;
  reviewedBy?: string | null;
  comment?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTOs for approval operations
 */
export interface CreateDashboardApprovalDto {
  entityType: EntityType;
  entityId: string;
  campaignId: string;
  submittedBy?: string;
}

export interface SubmitForApprovalDto {
  entityType: EntityType;
  entityId: string;
  submittedBy: string;
}

export interface ReviewDashboardApprovalDto {
  action: 'approve' | 'reject';
  comment?: string;
  reviewedBy: string;
}

/**
 * Query DTOs
 */
export interface FindApprovalsByEntityDto {
  entityType: EntityType;
  entityIds: string[];
}

export interface FindApprovalsByCampaignDto {
  campaignId: string;
  entityType?: EntityType;
}

export interface FindPendingApprovalsDto {
  entityType?: EntityType;
  submittedBy?: string;
}

/**
 * Utility functions for mapping between approval statuses
 */
export const mapApprovalStatusToEnum = (
  status: ApprovalStatusType
): ApprovalStatus => {
  switch (status) {
    case 'pending':
      return ApprovalStatus.PENDING;
    case 'approved':
      return ApprovalStatus.APPROVED;
    case 'rejected':
      return ApprovalStatus.REJECTED;
    default:
      return ApprovalStatus.PENDING;
  }
};

export const mapEnumToApprovalStatus = (
  status: ApprovalStatus
): ApprovalStatusType => {
  switch (status) {
    case ApprovalStatus.PENDING:
      return 'pending';
    case ApprovalStatus.APPROVED:
      return 'approved';
    case ApprovalStatus.REJECTED:
      return 'rejected';
    default:
      return 'pending';
  }
};
