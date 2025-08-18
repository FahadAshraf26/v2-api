import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

export interface UserModelAttributes {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  email: string;
  password?: string | null;
  address: string | null;
  apartment: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  dob: Date | null;
  phoneNumber: string | null;
  facebook: string | null;
  linkedIn: string | null;
  twitter: string | null;
  instagram: string | null;
  website: string | null;
  ssn: string | null;
  prefix: string | null;
  isVerified: string | null;
  detailSubmittedDate: Date | null;
  notificationToken: string | null;
  isEmailVerified: string | null;
  idVerifiedPrompt: boolean | null;
  portfolioVisited: boolean | null;
  ncPartyId: string | null;
  optOutOfEmail: Date | null;
  moneyMadeId: string | null;
  shouldVerifySsn: boolean;
  isSsnVerified: boolean;
  country: string | null;
  isIntermediary: boolean | null;
  tos: boolean | null;
  optIn: boolean | null;
  businessOwner: boolean;
  lastPrompt: Date | null;
  vcCustomerId: string | null;
  stripeCustomerId: string | null;
  idologyIdNumber: string | null;
  stripePaymentMethodId: string | null;
  signUpType: string | null;
  fcmToken: string | null;
  isBiometricEnabled: boolean | null;
  biometricKey: string | null;
  vcThreadBankCustomerId: string | null;
  isRaisegreen: boolean | null;
  kycProvider: string | null;
}

export const UserSchema = {
  name: 'User',
  tableName: 'users',

  attributes: {
    userId: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    apartment: {
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
    dob: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    phoneNumber: {
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
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ssn: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    prefix: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    detailSubmittedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isEmailVerified: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    idVerifiedPrompt: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    portfolioVisited: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    ncPartyId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    optOutOfEmail: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    moneyMadeId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shouldVerifySsn: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    isSsnVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isIntermediary: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    tos: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    optIn: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    businessOwner: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    lastPrompt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    vcCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    idologyIdNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stripePaymentMethodId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    signUpType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fcmToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isBiometricEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    biometricKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vcThreadBankCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isRaisegreen: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    kycProvider: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  options: {
    timestamps: true,
    paranoid: true,
    indexes: [{ fields: ['email'] }, { fields: ['createdAt'] }],
  },
  associations: {
    Investor: {
      type: 'hasOne',
      target: 'Investor',
      options: {
        foreignKey: 'userId',
        sourceKey: 'userId',
        as: 'investor',
      },
    },
    Owner: {
      type: 'hasOne',
      target: 'Owner',
      options: {
        foreignKey: 'userId',
        sourceKey: 'userId',
        as: 'owner',
      },
    },
  },
} as const;
