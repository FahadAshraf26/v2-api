import { DataTypes } from '@/infrastructure/persistence/orm/base-orm-model';

/**
 * Dashboard Approvals table model schema
 * Handles approval workflow for dashboard campaign entities (summary, info, etc.)
 */
export const DashboardApprovalsSchema = {
  name: 'DashboardApprovals',
  tableName: 'dashboardApprovals',

  attributes: {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },

    // Entity identification
    entityType: {
      type: DataTypes.ENUM,
      values: ['dashboard-campaign-summary', 'dashboard-campaign-info'],
      allowNull: false,
      comment: 'Type of entity being approved (summary, info, etc.)',
    },

    entityId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'ID of the entity being approved',
    },

    campaignId: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Campaign ID for easier querying and indexing',
    },

    // Simplified approval status
    status: {
      type: DataTypes.ENUM,
      values: ['pending', 'approved', 'rejected'],
      allowNull: false,
      defaultValue: 'pending',
    },

    // Workflow tracking timestamps
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Workflow tracking users
    submittedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'User who submitted for approval',
    },

    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Admin who reviewed the submission',
    },

    // Admin feedback
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Admin feedback or rejection reason',
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
  },

  options: {
    timestamps: true,
    indexes: [
      // Ensure one active approval per entity (pending or approved)
      {
        fields: ['entityType', 'entityId'],
        unique: true,
        name: 'unique_entity_approval',
      },
      { fields: ['campaignId'] },
      { fields: ['entityType'] },
      { fields: ['status'] },
      { fields: ['submittedBy'] },
      { fields: ['reviewedBy'] },
      { fields: ['submittedAt'] },
      { fields: ['reviewedAt'] },
      // Composite indexes for common queries
      { fields: ['entityType', 'status'] },
      { fields: ['campaignId', 'entityType'] },
      { fields: ['status', 'submittedAt'] },
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
