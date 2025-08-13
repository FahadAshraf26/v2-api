import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

/**
 * ORM-agnostic model schema definition for Dashboard Campaign Summary
 * Contains only business data - approval workflow handled by separate DashboardApprovals table
 */
export const DashboardCampaignSummarySchema = {
  name: 'DashboardCampaignSummary',
  tableName: 'dashboardCampaignSummary',

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

    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    tagLine: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    DashboardApproval: {
      type: 'hasOne',
      target: 'DashboardApprovals',
      options: {
        foreignKey: 'entityId',
        sourceKey: 'id',
        as: 'approval',
        scope: {
          entityType: 'dashboard-campaign-summary',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
  },
} as const;
