import { injectable } from 'tsyringe';
import { DashboardCampaignSummary } from '@/domain/dashboard-campaign-summary/entity/dashboard-campaign-summary.entity';
import { randomUUID } from 'crypto';
import {
  DashboardCampaignSummaryModelAttributes,
  DashboardCampaignSummaryProps,
  DashboardCampaignSummaryWithApproval,
} from '@/types/dashboard-campaign-summary';
import { DashboardApprovalProps } from '@/types/approval';
import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

@injectable()
export class DashboardCampaignSummaryMapper {
  /**
   * Map from joined data (business table + approval table) to domain entity
   */
  toDomain(data: DashboardCampaignSummaryWithApproval): DashboardCampaignSummary {
    const props: DashboardCampaignSummaryProps = {
      id: data.summary.id,
      campaignId: data.summary.campaignId,
      status: this.mapApprovalStatus(data.approval?.status),
      createdAt: data.summary.createdAt,
      updatedAt: data.summary.updatedAt,
    };

    // Add business fields if they exist
    if (data.summary.summary) {
      props.summary = data.summary.summary;
    }
    if (data.summary.tagLine) {
      props.tagLine = data.summary.tagLine;
    }

    // Add approval-related properties if approval data exists
    if (data.approval) {
      if (data.approval.submittedAt) {
        props.submittedAt = data.approval.submittedAt;
      }
      if (data.approval.reviewedAt) {
        props.reviewedAt = data.approval.reviewedAt;
      }
      if (data.approval.submittedBy) {
        props.submittedBy = data.approval.submittedBy;
      }
      if (data.approval.reviewedBy) {
        props.reviewedBy = data.approval.reviewedBy;
      }
      if (data.approval.comment) {
        props.comment = data.approval.comment;
      }
    }

    return DashboardCampaignSummary.fromPersistence(props);
  }

  /**
   * Map from business model attributes only (for creation/updates)
   */
  toDomainFromBusinessData(model: DashboardCampaignSummaryModelAttributes): DashboardCampaignSummary {
    const props: DashboardCampaignSummaryProps = {
      id: model.id,
      campaignId: model.campaignId,
      status: ApprovalStatus.PENDING, // Default status for new items
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };

    // Add optional business fields if they exist
    if (model.summary) {
      props.summary = model.summary;
    }
    if (model.tagLine) {
      props.tagLine = model.tagLine;
    }

    return DashboardCampaignSummary.fromPersistence(props);
  }

  /**
   * Map from domain entity to business table persistence model (no approval fields)
   */
  toBusinessPersistence(
    domain: DashboardCampaignSummary
  ): DashboardCampaignSummaryModelAttributes {
    return {
      id: domain.id,
      campaignId: domain.campaignId,
      summary: domain.summary || null,
      tagLine: domain.tagLine || null,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  /**
   * Map for business table updates (only business fields)
   */
  toBusinessPersistenceUpdate(
    domain: DashboardCampaignSummary
  ): Partial<DashboardCampaignSummaryModelAttributes> {
    const persistenceData: Partial<DashboardCampaignSummaryModelAttributes> = {
      summary: domain.summary || null,
      tagLine: domain.tagLine || null,
      updatedAt: domain.updatedAt,
    };

    return persistenceData;
  }

  /**
   * Map domain criteria to business table query criteria
   */
  toBusinessPersistenceCriteria(
    domainCriteria: Record<string, any>
  ): Record<string, any> {
    const persistenceCriteria: Record<string, any> = {};

    for (const [key, value] of Object.entries(domainCriteria)) {
      if (value === undefined) {
        continue;
      }

      // Only map business fields, ignore approval-related criteria
      switch (key) {
        case 'id':
        case 'campaignId':
        case 'summary':
        case 'tagLine':
        case 'createdAt':
        case 'updatedAt':
          persistenceCriteria[key] = value;
          break;

        // Ignore approval-related fields as they're handled separately
        case 'status':
        case 'submittedAt':
        case 'reviewedAt':
        case 'submittedBy':
        case 'reviewedBy':
        case 'comment':
          break;

        default:
          // For unknown fields, just pass through
          persistenceCriteria[key] = value;
          break;
      }
    }

    return persistenceCriteria;
  }

  /**
   * Map multiple joined data to domain entities
   */
  toDomainList(
    dataList: DashboardCampaignSummaryWithApproval[]
  ): DashboardCampaignSummary[] {
    return dataList.map(data => this.toDomain(data));
  }

  /**
   * Map multiple business models to domain entities (with default status)
   */
  toDomainListFromBusinessData(
    models: DashboardCampaignSummaryModelAttributes[]
  ): DashboardCampaignSummary[] {
    return models.map(model => this.toDomainFromBusinessData(model));
  }

  /**
   * Map approval status from database value to domain enum
   */
  private mapApprovalStatus(status?: string): ApprovalStatus {
    switch (status) {
      case 'approved':
        return ApprovalStatus.APPROVED;
      case 'rejected':
        return ApprovalStatus.REJECTED;
      case 'pending':
        return ApprovalStatus.PENDING;
      default:
        return ApprovalStatus.PENDING; // Default for items without approval record
    }
  }

  /**
   * Create domain entity from creation data
   */
  createDomainFromData(data: {
    campaignId: string;
    summary?: string;
    tagLine?: string;
    userId?: string;
  }): DashboardCampaignSummary {
    const createProps: any = {
      campaignId: data.campaignId,
    };

    if (data.summary) {
      createProps.summary = data.summary;
    }
    if (data.tagLine) {
      createProps.tagLine = data.tagLine;
    }

    return DashboardCampaignSummary.create(createProps);
  }
}
