import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

export const DashboardApprovalsSchema = {
  name: 'DashboardApprovals',
  tableName: 'dashboardApprovals',

  attributes: {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },

    campaignId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Campaign ID - unique to ensure one approval per campaign',
    },

    submittedItems: {
      type: DataTypes.JSON,
      allowNull: false,
      comment:
        'JSON object tracking which dashboard items were submitted for review',
      defaultValue: {
        dashboardCampaignInfo: false,
        dashboardCampaignSummary: false,
        dashboardSocials: false,
      },
    },

    status: {
      type: DataTypes.ENUM,
      values: ['pending', 'approved', 'rejected'],
      allowNull: false,
      defaultValue: 'pending',
    },

    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    submittedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User who submitted for approval',
    },

    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Admin who reviewed the submission',
    },

    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Admin feedback or rejection reason',
    },

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
    indexes: [
      {
        fields: ['campaignId'],
        unique: true,
        name: 'unique_campaign_approval',
      },
      { fields: ['status'] },
      { fields: ['submittedBy'] },
      { fields: ['reviewedBy'] },
      { fields: ['submittedAt'] },
      { fields: ['reviewedAt'] },
      { fields: ['status', 'submittedAt'] },
    ],
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
