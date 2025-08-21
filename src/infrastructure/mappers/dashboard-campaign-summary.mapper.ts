import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { Campaign } from '@/domain/campaign/entity/campaign.entity';
import { DashboardCampaignSummary } from '@/domain/dashboard-campaign-summary/entity/dashboard-campaign-summary.entity';

import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import {
  DashboardCampaignSummaryDto,
  DashboardCampaignSummaryModelAttributes,
  DashboardCampaignSummaryProps,
} from '@/types/dashboard-campaign-summary';

@injectable()
export class DashboardCampaignSummaryMapper {
  constructor(
    @inject(TOKENS.CampaignRepositoryToken)
    private readonly campaignRepository: CampaignRepository
  ) {}
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

  toDTO(domain: DashboardCampaignSummary): DashboardCampaignSummaryDto {
    const props = domain.toObject();
    return {
      id: props.id,
      campaignId: props.campaignId,
      summary: props.summary ?? null,
      tagLine: props.tagLine ?? null,
      status: props.status,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
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
    domainCriteria: Record<string, unknown>
  ): Record<string, unknown> {
    return domainCriteria;
  }

  async toCampaign(domain: DashboardCampaignSummary): Promise<Campaign | null> {
    const campaignResult = await this.campaignRepository.findById(
      domain.campaignId
    );
    if (campaignResult.isErr()) {
      return null;
    }
    const campaign = campaignResult.unwrap();
    if (campaign) {
      campaign.update(domain.toObject());
      return campaign;
    }
    return null;
  }
}
