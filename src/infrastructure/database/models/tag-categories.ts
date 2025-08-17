import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

export interface TagCategoriesModelAttributes {
  tagCategoryId: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export const TagCategoriesSchema = {
  name: 'TagCategories',
  tableName: 'tagCategories',

  attributes: {
    tagCategoryId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },

  options: {
    timestamps: true,
    paranoid: true,
    indexes: [{ fields: ['category'] }, { fields: ['createdAt'] }],
  },

  associations: {
    Tag: {
      type: 'hasMany',
      target: 'Tag',
      options: {
        foreignKey: 'tagCategoryId',
        sourceKey: 'tagCategoryId',
        as: 'tags',
      },
    },
  },
} as const;
