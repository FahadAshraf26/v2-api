import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

export interface IssuerModelAttributes {
  issuerId: string;
  issuerName: string;
  physicalAddress: string;
  website: string | null;
  businessType: string;
  legalEntityType: string;
  description: string | null;
  facebook: string | null;
  linkedIn: string | null;
  twitter: string | null;
  instagram: string | null;
  pinterest: string | null;
  reddit: string | null;
  tiktok: string | null;
  yelp: string | null;
  email: string;
  EIN: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phoneNumber: string | null;
  latitude: string | null;
  longitude: string | null;
  previousName: string | null;
  ncIssuerId: string | null;
  country: string | null;
  naicId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export const IssuerSchema = {
  name: 'Issuer',
  tableName: 'issuers',
  attributes: {
    issuerId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    issuerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    physicalAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    businessType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    legalEntityType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    facebook: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkedIn: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    twitter: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    instagram: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pinterest: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reddit: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    EIN: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    zipCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    previousName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ncIssuerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    naicId: {
      type: DataTypes.STRING,
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
};
