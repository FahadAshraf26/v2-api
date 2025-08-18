import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

export interface DashboardSocialsModelAttributes {
  id: string;
  campaignId: string;
  linkedIn?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  yelp?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * ORM-agnostic model schema definition for Dashboard Socials
 * Contains only business data - approval workflow handled by separate DashboardApprovals table
 */
export const DashboardSocialsSchema = {
  name: 'DashboardSocials',
  tableName: 'dashboardSocials',

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

    // Social media platform fields
    linkedIn: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    twitter: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    instagram: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    facebook: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    tiktok: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    yelp: {
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

    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
