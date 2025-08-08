import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

/**
 * ORM-agnostic model schema definition
 * This can be used with any ORM adapter (Sequelize, TypeORM, Prisma, etc.)
 */
export const DashboardCampaignInfoSchema = {
  name: 'DashboardCampaignInfo',
  tableName: 'dashboardCampaignInfo',

  attributes: {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    campaignId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    milestones: { type: DataTypes.TEXT, allowNull: true },
    investorPitch: { type: DataTypes.TEXT, allowNull: true },
    isShowPitch: { type: DataTypes.BOOLEAN, allowNull: true },
    investorPitchTitle: { type: DataTypes.TEXT, allowNull: true },
    approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    submittedAt: { type: DataTypes.DATE, allowNull: true },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
    submittedBy: { type: DataTypes.UUID, allowNull: true },
    reviewedBy: { type: DataTypes.UUID, allowNull: true },
    comment: { type: DataTypes.TEXT, allowNull: true },
  },

  options: {
    timestamps: true,
    indexes: [
      { fields: ['campaignId'] },
      { fields: ['submittedBy'] },
      { fields: ['approved'] },
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
