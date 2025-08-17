import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

export interface SubmissionModelAttributes {
  id: string;
  campaignId: string;
  submittedBy: string;
  items: {
    dashboardCampaignInfo?: boolean;
    dashboardCampaignSummary?: boolean;
    dashboardSocials?: boolean;
  };
  submissionNote?: string | null;
  status: 'pending' | 'completed' | 'failed';
  results?: any;
  createdAt: Date;
  updatedAt: Date;
}

export const SubmissionSchema = {
  name: 'Submission',
  tableName: 'submissions',

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

    submittedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'User who initiated the submission',
    },

    items: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Dashboard items that were requested for submission',
    },

    submissionNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional note provided by the submitter',
    },

    status: {
      type: DataTypes.ENUM,
      values: ['pending', 'completed', 'failed'],
      allowNull: false,
      defaultValue: 'pending',
    },

    results: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Results of processing each submitted item',
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
  },

  options: {
    timestamps: true,
    indexes: [
      { fields: ['campaignId'] },
      { fields: ['submittedBy'] },
      { fields: ['status'] },
      { fields: ['createdAt'] },
      { fields: ['campaignId', 'submittedBy'] },
      { fields: ['status', 'createdAt'] },
    ],
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
