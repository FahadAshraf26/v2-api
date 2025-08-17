import { randomUUID } from 'crypto';
import { Err, Ok, Result } from 'oxide.ts';

import { AggregateRoot } from '@/domain/core/aggregate-root';

import { SubmissionCompletedEvent } from '../events/submission-completed.event';
import { SubmissionSubmittedEvent } from '../events/submission-submitted.event';
import { SubmissionItems } from '../value-objects/submission-items.vo';
import { SubmissionStatus } from '../value-objects/submission-status.vo';

export interface SubmissionProps {
  id: string;
  campaignId: string;
  submittedBy: string;
  submissionNote?: string;
  items: SubmissionItems;
  status: SubmissionStatus;
  results: Record<
    string,
    { success: boolean; entityId?: string; error?: string }
  >;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export class Submission extends AggregateRoot<SubmissionProps> {
  private constructor(private props: SubmissionProps) {
    super(props.id);
  }

  static create(props: {
    campaignId: string;
    submittedBy: string;
    submissionNote?: string;
    items: { [key: string]: boolean };
  }): Result<Submission, Error> {
    // Domain validation
    if (!props.campaignId?.trim()) {
      return Err(new Error('Campaign ID is required'));
    }

    if (!props.submittedBy?.trim()) {
      return Err(new Error('Submitter ID is required'));
    }

    // Create value objects
    const itemsResult = SubmissionItems.create(props.items);
    if (itemsResult.isErr()) {
      return Err(itemsResult.unwrapErr());
    }

    const statusResult = SubmissionStatus.createPending();
    if (statusResult.isErr()) {
      return Err(statusResult.unwrapErr());
    }

    const now = new Date();
    const submission = new Submission({
      id: randomUUID(),
      campaignId: props.campaignId.trim(),
      submittedBy: props.submittedBy.trim(),
      submissionNote: props.submissionNote?.trim(),
      items: itemsResult.unwrap(),
      status: statusResult.unwrap(),
      results: {},
      createdAt: now,
      updatedAt: now,
    });

    // Emit domain event
    submission.addDomainEvent(
      new SubmissionSubmittedEvent(submission.id, {
        campaignId: submission.campaignId,
        submittedBy: submission.submittedBy,
        items: submission.items.getSelectedItems(),
        submissionNote: submission.submissionNote,
      })
    );

    return Ok(submission);
  }

  static fromPersistence(props: SubmissionProps): Submission {
    return new Submission(props);
  }

  // Getters
  override get id(): string {
    return this.props.id;
  }

  get campaignId(): string {
    return this.props.campaignId;
  }

  get submittedBy(): string {
    return this.props.submittedBy;
  }

  get submissionNote(): string | undefined {
    return this.props.submissionNote;
  }

  get items(): SubmissionItems {
    return this.props.items;
  }

  get status(): SubmissionStatus {
    return this.props.status;
  }

  get results(): Record<
    string,
    { success: boolean; entityId?: string; error?: string }
  > {
    return { ...this.props.results };
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  // Business methods
  startProcessing(): Result<void, Error> {
    const processsingResult = this.props.status.moveToProcessing();
    if (processsingResult.isErr()) {
      return Err(processsingResult.unwrapErr());
    }

    this.props.status = processsingResult.unwrap();
    this.props.updatedAt = new Date();

    return Ok(undefined);
  }

  recordItemResult(
    itemName: string,
    result: { success: boolean; entityId?: string; error?: string }
  ): Result<void, Error> {
    // Can only record results when processing
    if (!this.props.status.isProcessing()) {
      return Err(
        new Error('Can only record results for submissions being processed')
      );
    }

    // Validate item was requested
    if (!this.props.items.hasItem(itemName)) {
      return Err(
        new Error(`Item '${itemName}' was not requested for submission`)
      );
    }

    this.props.results[itemName] = result;
    this.props.updatedAt = new Date();

    return Ok(undefined);
  }

  complete(): Result<void, Error> {
    // Can only complete when processing
    if (!this.props.status.isProcessing()) {
      return Err(
        new Error('Can only complete submissions that are being processed')
      );
    }

    // Check all requested items have results
    const requestedItems = this.props.items.getSelectedItems();
    const completedItems = Object.keys(this.props.results);
    const allCompleted = requestedItems.every(item =>
      completedItems.includes(item)
    );

    if (!allCompleted) {
      return Err(
        new Error('Cannot complete submission with missing item results')
      );
    }

    const completedResult = this.props.status.moveToCompleted();
    if (completedResult.isErr()) {
      return Err(completedResult.unwrapErr());
    }

    const now = new Date();
    this.props.status = completedResult.unwrap();
    this.props.updatedAt = now;
    this.props.completedAt = now;

    // Emit completion event
    this.addDomainEvent(
      new SubmissionCompletedEvent(this.id, {
        campaignId: this.props.campaignId,
        submittedBy: this.props.submittedBy,
        results: this.props.results,
        hasSuccessfulItems: this.hasSuccessfulItems(),
        successfulItems: this.getSuccessfulItems(),
      })
    );

    return Ok(undefined);
  }

  fail(reason: string): Result<void, Error> {
    // Cannot fail completed submissions
    if (this.props.status.isCompleted()) {
      return Err(new Error('Cannot fail completed submissions'));
    }

    const failedResult = this.props.status.moveToFailed();
    if (failedResult.isErr()) {
      return Err(failedResult.unwrapErr());
    }

    this.props.status = failedResult.unwrap();
    this.props.updatedAt = new Date();

    return Ok(undefined);
  }

  // Query methods
  hasSuccessfulItems(): boolean {
    return Object.values(this.props.results).some(result => result.success);
  }

  getSuccessfulItems(): string[] {
    return Object.entries(this.props.results)
      .filter(([_, result]) => result.success)
      .map(([item, _]) => item);
  }

  isCompleted(): boolean {
    return this.props.status.isCompleted();
  }

  isPending(): boolean {
    return this.props.status.isPending();
  }

  isProcessing(): boolean {
    return this.props.status.isProcessing();
  }

  isFailed(): boolean {
    return this.props.status.isFailed();
  }

  canBeProcessed(): boolean {
    return this.props.status.isPending();
  }

  // Persistence
  toObject(): SubmissionProps {
    return {
      id: this.props.id,
      campaignId: this.props.campaignId,
      submittedBy: this.props.submittedBy,
      submissionNote: this.props.submissionNote,
      items: this.props.items,
      status: this.props.status,
      results: { ...this.props.results },
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      completedAt: this.props.completedAt,
    };
  }
}
