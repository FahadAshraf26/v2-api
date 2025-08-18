import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

/**
 * ORM-agnostic model schema definition for Dashboard Campaign Info
 */
export const DashboardCampaignInfoSchema = {
  name: 'DashboardCampaignInfo',
  tableName: 'dashboardCampaignInfo',

  attributes: {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },

    campaignId: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Business data fields
    milestones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    investorPitch: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    isShowPitch: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },

    investorPitchTitle: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(...Object.values(ApprovalStatus)),
      allowNull: false,
      defaultValue: ApprovalStatus.DRAFT,
    },

    // Standard timestamps
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },

  options: {
    timestamps: true,
    indexes: [{ fields: ['campaignId'], unique: true }],
  },

  associations: {
    Campaign: {
      type: 'belongsTo',
      target: 'Campaign',
      options: {
        foreignKey: 'campaignId',
        targetKey: 'campaignId',
        as: 'campaign',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
  },
} as const;
