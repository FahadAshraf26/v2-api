import { randomUUID } from 'crypto';
import { Err, Ok, Result } from 'oxide.ts';

import { AggregateRoot } from '@/domain/core/aggregate-root';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import { DashboardSocialsProps } from '@/types/dashboard-socials';

export class DashboardSocials extends AggregateRoot<DashboardSocialsProps> {
  private constructor(private props: DashboardSocialsProps) {
    super(props.id);
  }

  /** Factory method for creating new instance */
  static create(
    props: Omit<DashboardSocialsProps, 'createdAt' | 'updatedAt' | 'status'>
  ): Result<DashboardSocials, Error> {
    const now = new Date();

    if (!props.campaignId) {
      return Err(new Error('Campaign ID is required'));
    }

    const dashboardSocials = new DashboardSocials({
      ...props,
      status: ApprovalStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    });

    return Ok(dashboardSocials);
  }

  public static fromPersistence(
    props: DashboardSocialsProps
  ): DashboardSocials {
    return new DashboardSocials(props);
  }

  // Getters

  get campaignId(): string {
    return this.props.campaignId;
  }

  get linkedIn(): string | undefined {
    return this.props.linkedIn;
  }

  get twitter(): string | undefined {
    return this.props.twitter;
  }

  get instagram(): string | undefined {
    return this.props.instagram;
  }

  get facebook(): string | undefined {
    return this.props.facebook;
  }

  get tiktok(): string | undefined {
    return this.props.tiktok;
  }

  get yelp(): string | undefined {
    return this.props.yelp;
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
   * Update dashboard socials
   */
  update(updates: {
    linkedIn?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    yelp?: string;
  }): Result<void, Error> {
    if (this.props.status === ApprovalStatus.APPROVED) {
      return Err(new Error('Cannot update approved dashboard socials'));
    }

    // Apply updates - only update fields that are explicitly provided
    Object.keys(updates).forEach(key => {
      const value = updates[key as keyof typeof updates];
      if (value !== undefined) {
        (this.props as any)[key] = value;
      }
    });

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
      this.props.linkedIn?.trim() ||
      this.props.twitter?.trim() ||
      this.props.instagram?.trim() ||
      this.props.facebook?.trim() ||
      this.props.tiktok?.trim() ||
      this.props.yelp?.trim()
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
    this.props.submittedBy = userId;
    this.props.submittedAt = new Date();
    this.props.updatedAt = new Date();

    return Ok(undefined);
  }

  /**
   * Approve the entity
   */
  approve(adminId: string, comment?: string): Result<void, Error> {
    if (this.props.status === ApprovalStatus.APPROVED) {
      return Err(new Error('Entity is already approved'));
    }

    this.props.status = ApprovalStatus.APPROVED;
    this.props.reviewedBy = adminId;
    this.props.reviewedAt = new Date();
    this.props.comment = comment || undefined;
    this.props.updatedAt = new Date();

    return Ok(undefined);
  }

  /**
   * Reject the entity
   */
  reject(adminId: string, comment?: string): Result<void, Error> {
    if (this.props.status === ApprovalStatus.REJECTED) {
      return Err(new Error('Entity is already rejected'));
    }

    this.props.status = ApprovalStatus.REJECTED;
    this.props.reviewedBy = adminId;
    this.props.reviewedAt = new Date();
    this.props.comment = comment || undefined;
    this.props.updatedAt = new Date();

    return Ok(undefined);
  }

  /**
   * Get object representation
   */
  toObject(): DashboardSocialsProps {
    return { ...this.props };
  }
}
