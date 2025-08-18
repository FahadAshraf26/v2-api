/**
 * Simplified approval status enum for workflow management
 */
export enum ApprovalStatus {
  DRAFT = 'DRAFT', // User is working on the item
  PENDING = 'PENDING', // Waiting for admin review
  APPROVED = 'APPROVED', // Approved and published
  REJECTED = 'REJECTED', // Rejected with feedback
}

/**
 * Approval priority levels
 */
export enum ApprovalPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * Batch review actions
 */
export enum BatchReviewAction {
  APPROVE_ALL = 'APPROVE_ALL',
  REJECT_ALL = 'REJECT_ALL',
  INDIVIDUAL = 'INDIVIDUAL',
}

/**
 * Entity publication states (separate from approval status)
 */
export enum PublicationStatus {
  DRAFT = 'DRAFT', // Not visible to public
  PUBLISHED = 'PUBLISHED', // Live and visible
  ARCHIVED = 'ARCHIVED', // Previously published, now hidden
}

/**
 * Workflow transition helpers
 */
export const VALID_STATUS_TRANSITIONS: Record<
  ApprovalStatus,
  ApprovalStatus[]
> = {
  [ApprovalStatus.DRAFT]: [ApprovalStatus.PENDING],
  [ApprovalStatus.PENDING]: [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED],
  [ApprovalStatus.APPROVED]: [
    // Approved is final state - no transitions
  ],
  [ApprovalStatus.REJECTED]: [
    ApprovalStatus.PENDING, // User can resubmit
  ],
};

/**
 * Check if status transition is valid
 */
export const isValidStatusTransition = (
  from: ApprovalStatus,
  to: ApprovalStatus
): boolean => {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) || false;
};

/**
 * Get available actions for current status
 */
export const getAvailableActions = (status: ApprovalStatus): string[] => {
  switch (status) {
    case ApprovalStatus.DRAFT:
      return ['submit', 'edit', 'delete'];
    case ApprovalStatus.PENDING:
      return ['approve', 'reject', 'cancel'];

    case ApprovalStatus.REJECTED:
      return ['resubmit', 'edit'];

    case ApprovalStatus.APPROVED:
      return []; // No actions available - approved is final

    default:
      return [];
  }
};

/**
 * Get display-friendly status labels
 */
export const getStatusLabel = (status: ApprovalStatus): string => {
  switch (status) {
    case ApprovalStatus.DRAFT:
      return 'Draft';
    case ApprovalStatus.PENDING:
      return 'Pending Review';
    case ApprovalStatus.APPROVED:
      return 'Approved';
    case ApprovalStatus.REJECTED:
      return 'Rejected';
    default:
      return 'Unknown';
  }
};
