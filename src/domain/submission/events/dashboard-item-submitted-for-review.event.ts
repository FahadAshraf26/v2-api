import { DomainEvent } from '@/domain/core/domain-event';

export class DashboardItemSubmittedForReviewEvent extends DomainEvent {
  static eventName = 'dashboard-item.submitted-for-review';

  constructor(
    public readonly campaignId: string,
    public readonly userId: string,
    public readonly entityTypes: string[],
    public readonly timestamp: Date
  ) {
    super(DashboardItemSubmittedForReviewEvent.eventName);
  }

  getEventName(): string {
    return DashboardItemSubmittedForReviewEvent.eventName;
  }
}
