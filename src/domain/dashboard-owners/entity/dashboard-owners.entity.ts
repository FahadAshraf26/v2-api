import { randomUUID } from 'crypto';
import { Err, Ok, Result } from 'oxide.ts';

import { AggregateRoot } from '@/domain/core/aggregate-root';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import { DashboardOwnersProps } from '@/types/dashboard-owners';

export class DashboardOwners extends AggregateRoot<DashboardOwnersProps> {
  private constructor(private readonly props: DashboardOwnersProps) {
    super(props.id);
  }

  static create(
    props: Omit<
      DashboardOwnersProps,
      'id' | 'status' | 'createdAt' | 'updatedAt'
    >
  ): Result<DashboardOwners, Error> {
    const dashboardOwners = new DashboardOwners({
      ...props,
      id: randomUUID(),
      status: ApprovalStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return Ok(dashboardOwners);
  }

  public static fromPersistence(props: DashboardOwnersProps): DashboardOwners {
    return new DashboardOwners(props);
  }

  // Getters
  get campaignId(): string {
    return this.props.campaignId;
  }

  get name(): string {
    return this.props.name;
  }

  get position(): string {
    return this.props.position;
  }

  get description(): string {
    return this.props.description;
  }

  get ownerId(): string | undefined {
    return this.props.ownerId;
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

  update(updates: {
    name?: string;
    position?: string;
    description?: string;
    ownerId?: string;
    status?: ApprovalStatus;
  }): Result<void, Error> {
    if (this.props.status === ApprovalStatus.APPROVED) {
      return Err(new Error('Cannot update approved dashboard owners'));
    }

    if (updates.name !== undefined) this.props.name = updates.name;
    if (updates.position !== undefined) this.props.position = updates.position;
    if (updates.description !== undefined)
      this.props.description = updates.description;
    if (updates.ownerId !== undefined) this.props.ownerId = updates.ownerId;
    if (updates.status !== undefined) this.props.status = updates.status;

    this.props.updatedAt = new Date();
    return Ok(undefined);
  }

  canEdit(userId: string): boolean {
    return (
      this.props.status === ApprovalStatus.PENDING &&
      this.props.submittedBy === userId
    );
  }

  isReadyForSubmission(): boolean {
    return this.hasContent();
  }

  hasContent(): boolean {
    return !!(
      this.props.name?.trim() ||
      this.props.position?.trim() ||
      this.props.description?.trim()
    );
  }

  submit(userId: string): Result<void, Error> {
    if (this.props.status === ApprovalStatus.APPROVED) {
      return Err(new Error('Cannot submit already approved entity'));
    }
    if (!this.isReadyForSubmission()) {
      return Err(new Error('Entity needs content before submission'));
    }
    this.props.status = ApprovalStatus.PENDING;
    this.props.submittedBy = userId;
    this.props.submittedAt = new Date();
    this.props.updatedAt = new Date();
    return Ok(undefined);
  }

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

    return Ok(undefined);
  }

  reject(adminId: string, comment?: string): Result<void, Error> {
    if (this.props.status === ApprovalStatus.REJECTED) {
      return Err(new Error('Entity is already rejected'));
    }
    this.props.status = ApprovalStatus.REJECTED;
    this.props.reviewedBy = adminId;
    this.props.reviewedAt = new Date();
    if (comment) {
      this.props.comment = comment;
    }
    this.props.updatedAt = new Date();
    return Ok(undefined);
  }

  toObject(): DashboardOwnersProps {
    return { ...this.props };
  }

  toJSON(): Partial<DashboardOwnersProps> {
    const { ownerId, ...rest } = this.props;
    const json: Partial<DashboardOwnersProps> = {
      ...rest,
    };
    if (ownerId) {
      json.ownerId = ownerId;
    }
    return json;
  }
}
