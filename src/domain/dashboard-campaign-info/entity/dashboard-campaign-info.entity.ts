import { AggregateRoot } from '@/domain/core/aggregate-root';
import { Result, Ok, Err } from 'oxide.ts';
import { DashboardCampaignInfoCreatedEvent } from '@/domain/dashboard-campaign-info/events/dashboard-campaign-info-created.event';
import { DashboardCampaignInfoApprovedEvent } from '@/domain/dashboard-campaign-info/events/dashboard-campaign-info-approved.event';
import { DashboardCampaignInfoRejectedEvent } from '@/domain/dashboard-campaign-info/events/dashboard-campaign-info-rejected.event';
import { ApprovalStatus } from '@/shared/enums/dashboard-campaign-info.enums';
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

    if (!props.milestones) {
      return Err(new Error('Milestones are required'));
    }

    if (!props.investorPitch) {
      return Err(new Error('Investor pitch is required'));
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
      Omit<DashboardCampaignInfoProps, 'id' | 'campaignId' | 'createdAt'>
    >
  ): Result<void, Error> {
    if (this.props.status === ApprovalStatus.APPROVED) {
      return Err(new Error('Cannot update approved campaign info'));
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
      return Err(new Error('Campaign info is already approved'));
    }

    this.props.submittedBy = userId;
    this.props.submittedAt = new Date();
    this.props.status = ApprovalStatus.PENDING;
    this.props.updatedAt = new Date();

    return Ok(undefined);
  }

  approve(adminId: string, comment?: string): Result<void, Error> {
    if (this.props.status === ApprovalStatus.APPROVED) {
      return Err(new Error('Campaign info is already approved'));
    }

    this.props.reviewedBy = adminId;
    this.props.reviewedAt = new Date();
    this.props.status = ApprovalStatus.APPROVED;
    if (comment !== undefined) {
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
      new DashboardCampaignInfoRejectedEvent(
        this.props.id,
        this.props.campaignId,
        adminId,
        comment
      )
    );

    return Ok(undefined);
  }

  // Getters
  get campaignId(): string {
    return this.props.campaignId;
  }

  get milestones(): string {
    return this.props.milestones;
  }

  get investorPitch(): string {
    return this.props.investorPitch;
  }

  get isShowPitch(): boolean {
    return this.props.isShowPitch;
  }

  get investorPitchTitle(): string {
    return this.props.investorPitchTitle;
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

  toObject(): DashboardCampaignInfoProps {
    return { ...this.props };
  }
}
