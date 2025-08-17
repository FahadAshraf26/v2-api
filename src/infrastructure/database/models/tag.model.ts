import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

export interface TagModelAttributes {
  tagId: string;
  tagCategoryId: string;
  tag: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export const TagSchema = {
  name: 'Tag',
  tableName: 'tags',

  attributes: {
    tagId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    tagCategoryId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },

  options: {
    timestamps: true,
    paranoid: true,
    indexes: [{ fields: ['tag'] }, { fields: ['createdAt'] }],
  },

  associations: {
    Campaign: {
      type: 'belongsToMany',
      target: 'Campaign',
      through: 'CampaignTag',
      options: {
        foreignKey: 'tagId',
        otherKey: 'campaignId',
        as: 'campaigns',
      },
    },
    CampaignTag: {
      type: 'hasMany',
      target: 'CampaignTag',
      options: {
        foreignKey: 'tagId',
        sourceKey: 'tagId',
        as: 'campaignTags',
      },
    },
    TagCategories: {
      type: 'belongsTo',
      target: 'TagCategories',
      options: {
        foreignKey: 'tagCategoryId',
        sourceKey: 'tagCategoryId',
        as: 'category',
      },
    },
  },
} as const;
