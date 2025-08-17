import { DomainEvent } from '@/domain/core/domain-event';

export interface SubmissionCompletedEventData {
  campaignId: string;
  submittedBy: string;
  results: Record<
    string,
    { success: boolean; entityId?: string; error?: string }
  >;
  hasSuccessfulItems: boolean;
  successfulItems: string[];
}

export class SubmissionCompletedEvent extends DomainEvent {
  constructor(
    submissionId: string,
    public readonly data: SubmissionCompletedEventData
  ) {
    super(submissionId);
  }

  getEventName(): string {
    return 'SubmissionCompleted';
  }
}
