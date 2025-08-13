import { DomainEvent } from '@/domain/core/domain-event';

export class DashboardCampaignSummaryCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly campaignId: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'DashboardCampaignSummaryCreated';
  }
}
