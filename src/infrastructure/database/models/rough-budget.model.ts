import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

export interface RoughBudgetModelAttributes {
  roughBudgetId: string;
  campaignId: string;
  roughBudget: JSON;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export const RoughBudgetSchema = {
  name: 'RoughBudget',
  tableName: 'roughBudgets',

  attributes: {
    roughBudgetId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    campaignId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roughBudget: {
      type: DataTypes.JSON,
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
