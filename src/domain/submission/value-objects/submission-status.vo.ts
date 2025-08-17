import { Err, Ok, Result } from 'oxide.ts';

import { ValueObject } from '@/domain/core/value-object';

export enum SubmissionStatusType {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

interface SubmissionStatusProps {
  value: SubmissionStatusType;
}

export class SubmissionStatus extends ValueObject<SubmissionStatusProps> {
  private constructor(props: SubmissionStatusProps) {
    super(props);
  }

  static createPending(): Result<SubmissionStatus, Error> {
    return Ok(new SubmissionStatus({ value: SubmissionStatusType.PENDING }));
  }

  static createProcessing(): Result<SubmissionStatus, Error> {
    return Ok(new SubmissionStatus({ value: SubmissionStatusType.PROCESSING }));
  }

  static createCompleted(): Result<SubmissionStatus, Error> {
    return Ok(new SubmissionStatus({ value: SubmissionStatusType.COMPLETED }));
  }

  static createFailed(): Result<SubmissionStatus, Error> {
    return Ok(new SubmissionStatus({ value: SubmissionStatusType.FAILED }));
  }

  static fromValue(value: string): Result<SubmissionStatus, Error> {
    if (
      !Object.values(SubmissionStatusType).includes(
        value as SubmissionStatusType
      )
    ) {
      return Err(new Error(`Invalid submission status: ${value}`));
    }
    return Ok(new SubmissionStatus({ value: value as SubmissionStatusType }));
  }

  // State transitions (business rules)
  moveToProcessing(): Result<SubmissionStatus, Error> {
    if (this.props.value !== SubmissionStatusType.PENDING) {
      return Err(new Error('Can only move to processing from pending status'));
    }
    return SubmissionStatus.createProcessing();
  }

  moveToCompleted(): Result<SubmissionStatus, Error> {
    if (this.props.value !== SubmissionStatusType.PROCESSING) {
      return Err(
        new Error('Can only move to completed from processing status')
      );
    }
    return SubmissionStatus.createCompleted();
  }

  moveToFailed(): Result<SubmissionStatus, Error> {
    if (this.props.value === SubmissionStatusType.COMPLETED) {
      return Err(new Error('Cannot move completed submissions to failed'));
    }
    return SubmissionStatus.createFailed();
  }

  // Query methods
  isPending(): boolean {
    return this.props.value === SubmissionStatusType.PENDING;
  }

  isProcessing(): boolean {
    return this.props.value === SubmissionStatusType.PROCESSING;
  }

  isCompleted(): boolean {
    return this.props.value === SubmissionStatusType.COMPLETED;
  }

  isFailed(): boolean {
    return this.props.value === SubmissionStatusType.FAILED;
  }

  getValue(): SubmissionStatusType {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
