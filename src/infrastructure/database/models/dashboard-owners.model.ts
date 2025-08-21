import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

export const DashboardOwnersSchema = {
  name: 'DashboardOwners',
  tableName: 'dashboardOwners',

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
    name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    position: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ownerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ApprovalStatus)),
      allowNull: false,
      defaultValue: ApprovalStatus.DRAFT,
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },

  options: {
    timestamps: true,
    indexes: [{ fields: ['campaignId'] }],
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
