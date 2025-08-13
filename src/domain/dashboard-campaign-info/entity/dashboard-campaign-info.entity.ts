import { Err, Ok, Result } from 'oxide.ts';

import { AggregateRoot } from '@/domain/core/aggregate-root';
import { DashboardCampaignInfoApprovedEvent } from '@/domain/dashboard-campaign-info/events/dashboard-campaign-info-approved.event';
import { DashboardCampaignInfoCreatedEvent } from '@/domain/dashboard-campaign-info/events/dashboard-campaign-info-created.event';
import { DashboardCampaignInfoRejectedEvent } from '@/domain/dashboard-campaign-info/events/dashboard-campaign-info-rejected.event';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import { DashboardCampaignInfoProps } from '@/types/dashboard-campaign-info';

export class DashboardCampaignInfo extends AggregateRoot<DashboardCampaignInfoProps> {
  private constructor(private props: DashboardCampaignInfoProps) {
    super(props.id);
  }

  /** Factory method for creating new instance */
  static create(
    props: Omit<
      DashboardCampaignInfoProps,
      'createdAt' | 'updatedAt' | 'status'
    >
  ): Result<DashboardCampaignInfo, Error> {
    const now = new Date();

    if (!props.campaignId) {
      return Err(new Error('Campaign ID is required'));
    }

    const dashboardInfo = new DashboardCampaignInfo({
      ...props,
      status: ApprovalStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    });

    dashboardInfo.addDomainEvent(
      new DashboardCampaignInfoCreatedEvent(props.id, props.campaignId)
    );

    return Ok(dashboardInfo);
  }

  // Factory method for reconstituting from persistence
  static fromPersistence(
    props: DashboardCampaignInfoProps
  ): DashboardCampaignInfo {
    return new DashboardCampaignInfo(props);
  }

  // Override id getter from base class
  override get id(): string {
    return this.props.id;
  }

  // Getters

  get campaignId(): string {
    return this.props.campaignId;
  }

  get milestones(): string | undefined {
    return this.props.milestones;
  }

  get investorPitch(): string | undefined {
    return this.props.investorPitch;
  }

  get isShowPitch(): boolean | undefined {
    return this.props.isShowPitch;
  }

  get investorPitchTitle(): string | undefined {
    return this.props.investorPitchTitle;
  }

  get status(): ApprovalStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get submittedAt(): Date | undefined {
    return this.props.submittedAt;
  }

  get reviewedAt(): Date | undefined {
    return this.props.reviewedAt;
  }

  get submittedBy(): string | undefined {
    return this.props.submittedBy;
  }

  get reviewedBy(): string | undefined {
    return this.props.reviewedBy;
  }

  get comment(): string | undefined {
    return this.props.comment;
  }

  /**
   * Update dashboard campaign info
   */
  update(updates: {
    milestones?: string;
    investorPitch?: string;
    isShowPitch?: boolean;
    investorPitchTitle?: string;
  }): Result<void, Error> {
    if (this.props.status === ApprovalStatus.APPROVED) {
      return Err(new Error('Cannot update approved dashboard campaign info'));
    }

    // Apply updates
    if (updates.milestones !== undefined) {
      this.props.milestones = updates.milestones;
    }
    if (updates.investorPitch !== undefined) {
      this.props.investorPitch = updates.investorPitch;
    }
    if (updates.isShowPitch !== undefined) {
      this.props.isShowPitch = updates.isShowPitch;
    }
    if (updates.investorPitchTitle !== undefined) {
      this.props.investorPitchTitle = updates.investorPitchTitle;
    }

    this.props.updatedAt = new Date();
    return Ok(undefined);
  }

  /**
   * Check if entity can be edited by user
   */
  canEdit(userId: string): boolean {
    // Can edit if pending and user is the submitter
    return (
      this.props.status === ApprovalStatus.PENDING &&
      this.props.submittedBy === userId
    );
  }

  /**
   * Check if entity is ready for submission
   */
  isReadyForSubmission(): boolean {
    return this.hasContent();
  }

  /**
   * Check if entity has any content
   */
  hasContent(): boolean {
    return !!(
      this.props.milestones?.trim() ||
      this.props.investorPitch?.trim() ||
      this.props.investorPitchTitle?.trim() ||
      this.props.isShowPitch !== undefined
    );
  }

  /**
   * Submit for review
   */
  submit(userId: string): Result<void, Error> {
    if (this.props.status === ApprovalStatus.APPROVED) {
      return Err(new Error('Cannot submit already approved entity'));
    }

    if (!this.isReadyForSubmission()) {
      return Err(new Error('Entity needs content before submission'));
    }

    this.props.submittedBy = userId;
    this.props.submittedAt = new Date();
    this.props.status = ApprovalStatus.PENDING;
    this.props.updatedAt = new Date();

    return Ok(undefined);
  }

  /**
   * Approve entity
   */
  approve(adminId: string, comment?: string): Result<void, Error> {
    if (this.props.status === ApprovalStatus.APPROVED) {
      return Err(new Error('Entity is already approved'));
    }

    this.props.status = ApprovalStatus.APPROVED;
    this.props.reviewedBy = adminId;
    this.props.reviewedAt = new Date();
    if (comment) {
      this.props.comment = comment;
    }
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new DashboardCampaignInfoApprovedEvent(
        this.props.id,
        this.props.campaignId,
        adminId
      )
    );

    return Ok(undefined);
  }

  /**
   * Reject entity
   */
  reject(adminId: string, comment: string): Result<void, Error> {
    if (!comment?.trim()) {
      return Err(new Error('Comment is required when rejecting'));
    }

    this.props.status = ApprovalStatus.REJECTED;
    this.props.reviewedBy = adminId;
    this.props.reviewedAt = new Date();
    this.props.comment = comment;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new DashboardCampaignInfoRejectedEvent(
        this.props.id,
        this.props.campaignId,
        adminId,
        comment
      )
    );

    return Ok(undefined);
  }

  /**
   * Get object representation
   */
  toObject(): DashboardCampaignInfoProps {
    return { ...this.props };
  }
}
