import { Err, Ok, Result } from 'oxide.ts';

import { AggregateRoot } from '@/domain/core/aggregate-root';
import { DashboardCampaignSummaryApprovedEvent } from '@/domain/dashboard-campaign-summary/events/dashboard-campaign-summary-approved.event';
import { DashboardCampaignSummaryCreatedEvent } from '@/domain/dashboard-campaign-summary/events/dashboard-campaign-summary-created.event';
import { DashboardCampaignSummaryRejectedEvent } from '@/domain/dashboard-campaign-summary/events/dashboard-campaign-summary-rejected.event';

import { ApprovalStatus } from '@/shared/enums/dashboard-campaign-info.enums';

import { DashboardCampaignSummaryProps } from '@/types/dashboard-campaign-summary';

export class DashboardCampaignSummary extends AggregateRoot<DashboardCampaignSummaryProps> {
  private constructor(private props: DashboardCampaignSummaryProps) {
    super(props.id);
  }

  /** Factory method for creating new instance */
  static create(
    props: Omit<
      DashboardCampaignSummaryProps,
      'createdAt' | 'updatedAt' | 'status'
    >
  ): Result<DashboardCampaignSummary, Error> {
    const now = new Date();

    if (!props.campaignId) {
      return Err(new Error('Campaign ID is required'));
    }

    const dashboardSummary = new DashboardCampaignSummary({
      ...props,
      status: ApprovalStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    });

    dashboardSummary.addDomainEvent(
      new DashboardCampaignSummaryCreatedEvent(props.id, props.campaignId)
    );

    return Ok(dashboardSummary);
  }

  // Factory method for reconstituting from persistence
  static fromPersistence(
    props: DashboardCampaignSummaryProps
  ): DashboardCampaignSummary {
    return new DashboardCampaignSummary(props);
  }

  // Business methods
  canEdit(userId: string): boolean {
    // User can edit if they submitted it and it's not approved
    if (
      this.props.submittedBy === userId &&
      this.props.status !== ApprovalStatus.APPROVED
    ) {
      return true;
    }
    return false;
  }

  update(
    updates: Partial<
      Omit<DashboardCampaignSummaryProps, 'id' | 'campaignId' | 'createdAt'>
    >
  ): Result<void, Error> {
    if (this.props.status === ApprovalStatus.APPROVED) {
      return Err(new Error('Cannot update approved campaign summary'));
    }

    this.props = {
      ...this.props,
      ...updates,
      updatedAt: new Date(),
    };

    return Ok(undefined);
  }

  submit(userId: string): Result<void, Error> {
    if (this.props.status === ApprovalStatus.APPROVED) {
      return Err(new Error('Campaign summary is already approved'));
    }

    this.props.submittedBy = userId;
    this.props.submittedAt = new Date();
    this.props.status = ApprovalStatus.PENDING;
    this.props.updatedAt = new Date();

    return Ok(undefined);
  }

  approve(adminId: string, comment?: string): Result<void, Error> {
    if (this.props.status === ApprovalStatus.APPROVED) {
      return Err(new Error('Campaign summary is already approved'));
    }

    this.props.reviewedBy = adminId;
    this.props.reviewedAt = new Date();
    this.props.status = ApprovalStatus.APPROVED;
    if (comment !== undefined) {
      this.props.comment = comment;
    }
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new DashboardCampaignSummaryApprovedEvent(
        this.props.id,
        this.props.campaignId,
        adminId
      )
    );

    return Ok(undefined);
  }

  reject(adminId: string, comment: string): Result<void, Error> {
    if (!comment) {
      return Err(new Error('Comment is required when rejecting'));
    }

    this.props.reviewedBy = adminId;
    this.props.reviewedAt = new Date();
    this.props.status = ApprovalStatus.REJECTED;
    this.props.comment = comment;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new DashboardCampaignSummaryRejectedEvent(
        this.props.id,
        this.props.campaignId,
        adminId,
        comment
      )
    );

    return Ok(undefined);
  }

  // Business rules
  isReadyForSubmission(): boolean {
    return !!(this.props.summary || this.props.tagLine);
  }

  hasContent(): boolean {
    return !!(this.props.summary?.trim() || this.props.tagLine?.trim());
  }

  // Getters
  get campaignId(): string {
    return this.props.campaignId;
  }

  get summary(): string | undefined {
    return this.props.summary;
  }

  get tagLine(): string | undefined {
    return this.props.tagLine;
  }

  get status(): ApprovalStatus {
    return this.props.status;
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

  toObject(): DashboardCampaignSummaryProps {
    return { ...this.props };
  }
}
