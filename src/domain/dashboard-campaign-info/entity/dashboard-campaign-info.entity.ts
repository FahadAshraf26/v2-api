import { randomUUID } from 'crypto';
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
      'id' | 'status' | 'createdAt' | 'updatedAt'
    >
  ): Result<DashboardCampaignInfo, Error> {
    const milestones = Array.isArray(props.milestones)
      ? JSON.stringify(props.milestones)
      : (props.milestones ?? null);

    const dashboardInfo = new DashboardCampaignInfo({
      ...props,
      id: randomUUID(),
      milestones,
      status: ApprovalStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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

  get milestones(): string | null {
    return this.props.milestones || null;
  }

  get investorPitch(): string | null {
    return this.props.investorPitch || null;
  }

  get isShowPitch(): boolean | null {
    return this.props.isShowPitch || null;
  }

  get investorPitchTitle(): string | null {
    return this.props.investorPitchTitle || null;
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

  /**
   * Update dashboard campaign info
   */
  update(updates: {
    milestones?: string;
    investorPitch?: string;
    isShowPitch?: boolean;
    investorPitchTitle?: string;
    status?: ApprovalStatus;
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
    if (updates.status !== undefined) {
      this.props.status = updates.status;
    }

    this.props.updatedAt = new Date();
    return Ok(undefined);
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
