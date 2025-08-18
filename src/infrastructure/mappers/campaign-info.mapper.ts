import { injectable } from 'tsyringe';

import { CampaignInfo } from '@/domain/campaign-info/entity/campaign-info.entity';

import { CampaignInfoModelAttributes } from '@/infrastructure/database/models/campaign-info.model';

import { CampaignInfoProps } from '@/types/campaign-info';

@injectable()
export class CampaignInfoMapper {
  toDomain(model: CampaignInfoModelAttributes): CampaignInfo {
    const props: CampaignInfoProps = {
      ...model,
    };
    return CampaignInfo.fromPersistence(props);
  }

  toPersistence(domain: CampaignInfo): CampaignInfoModelAttributes {
    const props = domain.toObject();
    return {
      ...props,
      financialHistory: props.financialHistory ?? '',
      competitors: props.competitors ?? '',
      milestones: props.milestones ?? '',
      investorPitch: props.investorPitch ?? '',
      risks: props.risks ?? '',
      target: props.target ?? null,
      isShowPitch: props.isShowPitch ?? false,
      investorPitchTitle: props.investorPitchTitle ?? '',
    };
  }
}
