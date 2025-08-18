import { Entity } from '@/domain/core/entity';

import { CampaignInfoProps } from '@/types/campaign-info';

export class CampaignInfo extends Entity<CampaignInfoProps> {
  constructor(props: CampaignInfoProps, id?: string) {
    super(id);
    this.props = props;
  }

  private props: CampaignInfoProps;

  static create(
    props: Omit<CampaignInfoProps, 'createdAt' | 'updatedAt'>
  ): CampaignInfo {
    const now = new Date();
    return new CampaignInfo(
      {
        ...props,
        createdAt: now,
        updatedAt: now,
      },
      props['campaignInfoId']
    );
  }

  static fromPersistence(props: CampaignInfoProps): CampaignInfo {
    return new CampaignInfo(props, props['campaignInfoId']);
  }

  toObject(): CampaignInfoProps {
    return this.props;
  }
}
