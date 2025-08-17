import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

export interface CampaignModelAttributes {
  campaignId: string;
  campaignName: string;
  campaignStartDate?: Date | null;
  campaignDuration?: number | null;
  campaignExpirationDate?: Date | null;
  campaignStage?: string | null;
  campaignTargetAmount: number;
  campaignMinimumAmount: number;
  investmentType: string;
  earningProcess?: string | null;
  overSubscriptionAccepted?: boolean | null;
  typeOfSecurityOffered?: string | null;
  useOfProceeds?: string | null;
  salesLead?: string | null;
  summary?: string | null;
  demoLink?: string | null;
  isLocked?: boolean | null;
  financialProjectionsDescription?: string | null;
  howHoneycombIsCompensated?: string | null;
  campaignDocumentUrl?: string | null;
  ncOfferingId?: string | null;
  slug: string;
  repaymentSchedule?: string | null;
  collateral?: string | null;
  annualInterestRate?: number | null;
  maturityDate?: Date | null;
  repaymentStartDate?: Date | null;
  loanDuration?: number | null;
  isChargeFee: boolean;
  interestOnlyLoanDuration?: number | null;
  campaignEndTime?: string | null;
  campaignTimezone?: string | null;
  blanketLien?: boolean | null;
  equipmentLien?: boolean | null;
  isPersonalGuarantyFilled?: boolean | null;
  personalGuaranty?: string | null;
  shareValue?: number | null;
  escrowType?: string | null;
  isChargeStripe: boolean;
  isCampaignAddress: boolean;
  competitorOffering?: string | null;
  isShowOnExplorePage: boolean;
  investmentConfiguration?: any | null;
  dividendRate?: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// ORM-agnostic model schema definition
export const CampaignSchema = {
  name: 'Campaign',
  tableName: 'campaigns',

  attributes: {
    campaignId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    campaignName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    campaignStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    campaignDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    campaignExpirationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    campaignStage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    campaignTargetAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    campaignMinimumAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    investmentType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    earningProcess: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    overSubscriptionAccepted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    typeOfSecurityOffered: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    useOfProceeds: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    salesLead: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    demoLink: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    financialProjectionsDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    howHoneycombIsCompensated: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    campaignDocumentUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ncOfferingId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    repaymentSchedule: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    collateral: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    annualInterestRate: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    maturityDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    repaymentStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    loanDuration: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    isChargeFee: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    interestOnlyLoanDuration: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    campaignEndTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    campaignTimezone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    blanketLien: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    equipmentLien: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    isPersonalGuarantyFilled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    personalGuaranty: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shareValue: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    escrowType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isChargeStripe: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isCampaignAddress: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    competitorOffering: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isShowOnExplorePage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    investmentConfiguration: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    dividendRate: {
      type: DataTypes.FLOAT,
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

  options: {
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['campaignStage'] },
      { fields: ['investmentType'] },
      { fields: ['isShowOnExplorePage'] },
      { fields: ['createdAt'] },
    ],
  },

  associations: {
    DashboardCampaignInfo: {
      type: 'hasOne',
      target: 'DashboardCampaignInfo',
      options: {
        foreignKey: 'campaignId',
        sourceKey: 'campaignId',
        as: 'dashboardInfo',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    DashboardCampaignSummary: {
      type: 'hasOne',
      target: 'DashboardCampaignSummary',
      options: {
        foreignKey: 'campaignId',
        sourceKey: 'campaignId',
        as: 'dashboardSummary',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    DashboardSocials: {
      type: 'hasOne',
      target: 'DashboardSocials',
      options: {
        foreignKey: 'campaignId',
        sourceKey: 'campaignId',
        as: 'dashboardSocials',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    Tag: {
      type: 'belongsToMany',
      target: 'Tag',
      through: 'CampaignTag',
      options: {
        foreignKey: 'campaignId',
        otherKey: 'tagId',
        as: 'tags',
      },
    },
    CampaignInfo: {
      type: 'hasOne',
      target: 'CampaignInfo',
      options: {
        foreignKey: 'campaignId',
        sourceKey: 'campaignId',
        as: 'campaignInfo',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    },
    RoughBudget: {
      type: 'hasMany',
      target: 'RoughBudget',
      options: {
        foreignKey: 'campaignId',
        sourceKey: 'campaignId',
        as: 'roughBudgets',
      },
    },
  },
} as const;
