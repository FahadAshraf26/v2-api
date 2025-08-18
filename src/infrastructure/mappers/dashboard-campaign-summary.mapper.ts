import { injectable } from 'tsyringe';

import { DashboardCampaignSummary } from '@/domain/dashboard-campaign-summary/entity/dashboard-campaign-summary.entity';

import { CampaignModelAttributes } from '@/infrastructure/database/models/campaign.model';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import {
  DashboardCampaignSummaryModelAttributes,
  DashboardCampaignSummaryProps,
} from '@/types/dashboard-campaign-summary';

@injectable()
export class DashboardCampaignSummaryMapper {
  toDomain(
    model: DashboardCampaignSummaryModelAttributes
  ): DashboardCampaignSummary {
    const props: DashboardCampaignSummaryProps = {
      id: model.id,
      campaignId: model.campaignId,
      summary: model.summary || null,
      tagLine: model.tagLine || null,
      status: model.status as ApprovalStatus,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
    return DashboardCampaignSummary.fromPersistence(props);
  }

  toPersistence(
    domain: DashboardCampaignSummary
  ): DashboardCampaignSummaryModelAttributes {
    return domain.toObject();
  }

  toDomainFromBusinessData(
    model: DashboardCampaignSummaryModelAttributes
  ): DashboardCampaignSummary {
    return this.toDomain(model);
  }

  toBusinessPersistence(
    domain: DashboardCampaignSummary
  ): DashboardCampaignSummaryModelAttributes {
    return this.toPersistence(domain);
  }

  toBusinessPersistenceUpdate(
    domain: DashboardCampaignSummary
  ): Partial<DashboardCampaignSummaryModelAttributes> {
    return domain.toObject();
  }

  toBusinessPersistenceCriteria(
    domainCriteria: Record<string, any>
  ): Record<string, any> {
    return domainCriteria;
  }

  toCampaignPersistence(
    domain: DashboardCampaignSummary
  ): Partial<CampaignModelAttributes> {
    const { id, createdAt, updatedAt, status, ...rest } = domain.toObject();
    return { ...rest, issuerId: domain.campaignId };
  }
}
