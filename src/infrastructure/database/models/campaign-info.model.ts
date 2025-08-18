import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

export interface CampaignInfoModelAttributes {
  campaignInfoId: string;
  campaignId: string;
  financialHistory: string;
  competitors: string;
  milestones: string;
  investorPitch: string;
  risks: string;
  target: JSON | null;
  isShowPitch: boolean;
  investorPitchTitle: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export const CampaignInfoSchema = {
  name: 'CampaignInfo',
  tableName: 'campaignInfos',

  attributes: {
    campaignInfoId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    campaignId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    financialHistory: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    competitors: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    milestones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    investorPitch: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    risks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    target: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    isShowPitch: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    investorPitchTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },

  options: {
    timestamps: true,
    paranoid: true,
    indexes: [{ fields: ['campaignId'] }, { fields: ['createdAt'] }],
  },

  associations: {
    Campaign: {
      type: 'belongsTo',
      target: 'Campaign',
      options: {
        foreignKey: 'campaignId',
        sourceKey: 'campaignId',
      },
    },
  },
} as const;
