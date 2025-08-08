import { DomainEvent } from '@/domain/core/domain-event';

export class DashboardCampaignInfoRejectedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly campaignId: string,
    public readonly rejectedBy: string,
    public readonly reason: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'DashboardCampaignInfoRejected';
  }
}
