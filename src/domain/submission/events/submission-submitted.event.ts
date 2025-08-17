import { DomainEvent } from '@/domain/core/domain-event';

export interface SubmissionSubmittedEventData {
  campaignId: string;
  submittedBy: string;
  items: string[];
  submissionNote?: string;
}

export class SubmissionSubmittedEvent extends DomainEvent {
  constructor(
    submissionId: string,
    public readonly data: SubmissionSubmittedEventData
  ) {
    super(submissionId);
  }

  getEventName(): string {
    return 'SubmissionSubmitted';
  }
}
