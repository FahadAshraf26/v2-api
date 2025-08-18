import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

export interface InvestorModelAttributes {
  investorId: string;
  annualIncome: number;
  netWorth: number;
  incomeVerificationTriggered: boolean;
  investingAvailable: number;
  isAccredited: string;
  investmentCap: number | null;
  userProvidedCurrentInvestments: number | null;
  userProvidedCurrentInvestmentsDate: Date | null;
  investReadyToken: string | null;
  investReadyRefreshToken: string | null;
  investReadyUserHash: string | null;
  accreditationExpiryDate: Date | null;
  dwollaCustomerId: string | null;
  accreditedInvestorSubmission: string | null;
  accreditedInvestorSubmissionDate: Date | null;
  dwollaVerificationStatus: string | null;
  ncAccountId: string | null;
  incomeNetWorthSignedOn: Date;
  vcCustomerKey: string | null;
  vcThreadBankCustomerKey: string | null;
  userId?: string;
}

export const InvestorSchema = {
  name: 'Investor',
  tableName: 'investors',

  attributes: {
    investorId: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    annualIncome: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    netWorth: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    incomeVerificationTriggered: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    investingAvailable: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isAccredited: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    investmentCap: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    userProvidedCurrentInvestments: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    userProvidedCurrentInvestmentsDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    investReadyToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    investReadyRefreshToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    investReadyUserHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accreditationExpiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dwollaCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accreditedInvestorSubmission: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accreditedInvestorSubmissionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dwollaVerificationStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ncAccountId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    incomeNetWorthSignedOn: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    vcCustomerKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vcThreadBankCustomerKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.STRING,
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
