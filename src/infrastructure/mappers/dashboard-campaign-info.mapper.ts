import { randomUUID } from 'crypto';
import { injectable } from 'tsyringe';

import { DashboardCampaignInfo } from '@/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';

import { CampaignInfoModelAttributes } from '@/infrastructure/database/models/campaign-info.model';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import {
  DashboardCampaignInfoDto,
  DashboardCampaignInfoModelAttributes,
  DashboardCampaignInfoProps,
} from '@/types/dashboard-campaign-info';

@injectable()
export class DashboardCampaignInfoMapper {
  toDomain(model: DashboardCampaignInfoModelAttributes): DashboardCampaignInfo {
    const props: DashboardCampaignInfoProps = {
      id: model.id,
      campaignId: model.campaignId,
      milestones: model.milestones || null,
      investorPitch: model.investorPitch || null,
      isShowPitch: model.isShowPitch || false,
      investorPitchTitle: model.investorPitchTitle || null,
      status: model.status as ApprovalStatus,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
    return DashboardCampaignInfo.fromPersistence(props);
  }

  toDTO(domain: DashboardCampaignInfo): DashboardCampaignInfoDto {
    const props = domain.toObject();
    return {
      id: props.id,
      campaignId: props.campaignId,
      milestones: props.milestones ?? null,
      investorPitch: props.investorPitch ?? null,
      isShowPitch: props.isShowPitch ?? false,
      investorPitchTitle: props.investorPitchTitle ?? null,
      status: props.status,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  toPersistence(
    domain: DashboardCampaignInfo
  ): DashboardCampaignInfoModelAttributes {
    return domain.toObject();
  }

  toDomainFromBusinessData(
    model: DashboardCampaignInfoModelAttributes
  ): DashboardCampaignInfo {
    return this.toDomain(model);
  }

  toBusinessPersistence(
    domain: DashboardCampaignInfo
  ): DashboardCampaignInfoModelAttributes {
    return this.toPersistence(domain);
  }

  toBusinessPersistenceUpdate(
    domain: DashboardCampaignInfo
  ): Partial<DashboardCampaignInfoModelAttributes> {
    return domain.toObject();
  }

  toBusinessPersistenceCriteria(
    domainCriteria: Record<string, any>
  ): Record<string, any> {
    return domainCriteria;
  }

  toCampaignInfoPersistence(
    domain: DashboardCampaignInfo
  ): Partial<CampaignInfoModelAttributes> {
    const {
      id,
      createdAt,
      updatedAt,
      status,
      milestones,
      investorPitch,
      isShowPitch,
      investorPitchTitle,
      ...rest
    } = domain.toObject();
    return {
      ...rest,
      campaignInfoId: randomUUID(),
      milestones: milestones || '',
      investorPitch: investorPitch || '',
      isShowPitch: isShowPitch || false,
      investorPitchTitle: investorPitchTitle || '',
    };
  }
}
