import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

export interface CampaignTagModelAttributes {
  campaignTagId: string;
  campaignId: string;
  tagId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export const CampaignTagSchema = {
  name: 'CampaignTag',
  tableName: 'campaignTags',

  attributes: {
    campaignTagId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    campaignId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tagId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },

  options: {
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['campaignId'] },
      { fields: ['tagId'] },
      { fields: ['campaignId', 'tagId'], unique: true },
      { fields: ['createdAt'] },
    ],
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
    Tag: {
      type: 'belongsTo',
      target: 'Tag',
      options: {
        foreignKey: 'tagId',
        sourceKey: 'tagId',
      },
    },
  },
} as const;
