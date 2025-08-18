export interface CampaignInfoProps {
  campaignInfoId: string;
  campaignId: string;
  financialHistory?: string | null;
  competitors?: string | null;
  milestones?: string | null;
  investorPitch?: string | null;
  risks?: string | null;
  target?: JSON | null;
  isShowPitch?: boolean;
  investorPitchTitle?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
