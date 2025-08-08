import { DomainEvent } from '@/domain/core/domain-event';

export class DashboardCampaignInfoCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly campaignId: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'DashboardCampaignInfoCreated';
  }
}
