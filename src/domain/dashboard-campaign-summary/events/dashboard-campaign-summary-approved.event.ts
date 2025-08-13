import { DomainEvent } from '@/domain/core/domain-event';

export class DashboardCampaignSummaryApprovedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly campaignId: string,
    public readonly approvedBy: string
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'DashboardCampaignSummaryApproved';
  }
}
