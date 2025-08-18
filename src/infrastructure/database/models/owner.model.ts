import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

export interface OwnerModelAttributes {
  ownerId: string;
  title: string;
  subTitle: string | null;
  description: string;
  primaryOwner: boolean;
  beneficialOwner: boolean;
  beneficialOwnerId: string | null;
  businessOwner: boolean | null;
  userId?: string;
}

export const OwnerSchema = {
  name: 'Owner',
  tableName: 'owners',

  attributes: {
    ownerId: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    primaryOwner: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    beneficialOwner: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    beneficialOwnerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    businessOwner: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
  },

  options: {
    timestamps: true,
    paranoid: true,
    indexes: [{ fields: ['userId'] }, { fields: ['createdAt'] }],
  },
  associations: {
    User: {
      type: 'belongsTo',
      target: 'User',
      options: {
        foreignKey: 'userId',
        sourceKey: 'userId',
        as: 'user',
      },
    },
  },
} as const;
