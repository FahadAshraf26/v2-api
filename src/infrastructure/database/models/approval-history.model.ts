import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

export const ApprovalHistorySchema = {
  name: 'ApprovalHistory',
  tableName: 'approvalHistory',

  attributes: {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },

    entityId: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    entityType: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(...Object.values(ApprovalStatus)),
      allowNull: false,
    },

    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },

  options: {
    timestamps: true,
    updatedAt: false,
    indexes: [{ fields: ['entityId', 'entityType'] }],
  },
} as const;
