import { randomUUID } from 'crypto';
import { Err, Ok, Result } from 'oxide.ts';

import { AggregateRoot } from '@/domain/core/aggregate-root';
import { DashboardCampaignSummaryApprovedEvent } from '@/domain/dashboard-campaign-summary/events/dashboard-campaign-summary-approved.event';
import { DashboardCampaignSummaryCreatedEvent } from '@/domain/dashboard-campaign-summary/events/dashboard-campaign-summary-created.event';
import { DashboardCampaignSummaryRejectedEvent } from '@/domain/dashboard-campaign-summary/events/dashboard-campaign-summary-rejected.event';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import { DashboardCampaignSummaryProps } from '@/types/dashboard-campaign-summary';

export class DashboardCampaignSummary extends AggregateRoot<DashboardCampaignSummaryProps> {
  private constructor(private props: DashboardCampaignSummaryProps) {
    super(props.id);
  }

  /** Factory method for creating new instance */
  static create(
    props: Omit<
      DashboardCampaignSummaryProps,
      'id' | 'status' | 'createdAt' | 'updatedAt'
    >
  ): Result<DashboardCampaignSummary, Error> {
    const dashboardSummary = new DashboardCampaignSummary({
      ...props,
      id: randomUUID(),
      status: ApprovalStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return Ok(dashboardSummary);
  }

  // Factory method for reconstituting from persistence
  static fromPersistence(
    props: DashboardCampaignSummaryProps
  ): DashboardCampaignSummary {
    return new DashboardCampaignSummary(props);
  }

  update(updates: Partial<DashboardCampaignSummaryProps>): Result<void, Error> {
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

    this.props.status = ApprovalStatus.PENDING;
    this.props.updatedAt = new Date();

    return Ok(undefined);
  }

  approve(adminId: string, comment?: string): Result<void, Error> {
    if (this.props.status === ApprovalStatus.APPROVED) {
      return Err(new Error('Campaign summary is already approved'));
    }

    this.props.status = ApprovalStatus.APPROVED;
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

    this.props.status = ApprovalStatus.REJECTED;
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

  get summary(): string | null {
    return this.props.summary || null;
  }

  get tagLine(): string | null {
    return this.props.tagLine || null;
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

  toObject(): DashboardCampaignSummaryProps {
    return { ...this.props };
  }
}
