import { injectable } from 'tsyringe';
import { DashboardCampaignInfo } from '@/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';
import { randomUUID } from 'crypto';
import {
  DashboardCampaignInfoModelAttributes,
  DashboardCampaignInfoProps,
} from '@/types/dashboard-campaign-info';
import { ApprovalStatus } from '@/shared/enums/dashboard-campaign-info.enums';

@injectable()
export class DashboardCampaignInfoMapper {
  /**
   * Map from persistence model to domain entity
   */
  toDomain(model: DashboardCampaignInfoModelAttributes): DashboardCampaignInfo {
    const props: DashboardCampaignInfoProps = {
      id: model.id,
      campaignId: model.campaignId,
      milestones: model.milestones,
      investorPitch: model.investorPitch,
      isShowPitch: model.isShowPitch,
      investorPitchTitle: model.investorPitchTitle,
      status: this.mapApprovalStatus(model.approved),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };

    // Conditionally add optional properties to avoid undefined assignment issues
    if (model.submittedAt) {
      props.submittedAt = model.submittedAt;
    }
    if (model.reviewedAt) {
      props.reviewedAt = model.reviewedAt;
    }
    if (model.submittedBy) {
      props.submittedBy = model.submittedBy;
    }
    if (model.reviewedBy) {
      props.reviewedBy = model.reviewedBy;
    }
    if (model.comment) {
      props.comment = model.comment;
    }

    return DashboardCampaignInfo.fromPersistence(props);
  }

  /**
   * Map from domain entity to persistence model
   */
  toPersistence(
    domain: DashboardCampaignInfo
  ): Partial<DashboardCampaignInfoModelAttributes> {
    return {
      id: domain.id || randomUUID(),
      campaignId: domain.campaignId,
      milestones: domain.milestones,
      investorPitch: domain.investorPitch,
      isShowPitch: domain.isShowPitch,
      investorPitchTitle: domain.investorPitchTitle,
      approved: this.mapToApprovedBoolean(domain.status),
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      submittedAt: domain.submittedAt || null,
      reviewedAt: domain.reviewedAt || null,
      submittedBy: domain.submittedBy || null,
      reviewedBy: domain.reviewedBy || null,
      comment: domain.comment || null,
    };
  }

  /**
   * Map from domain entity to persistence update data (excludes readonly fields)
   */
  toPersistenceUpdate(
    domain: DashboardCampaignInfo
  ): Partial<DashboardCampaignInfoModelAttributes> {
    const persistenceData = this.toPersistence(domain);

    // Remove fields that shouldn't be updated
    delete persistenceData.id;
    delete persistenceData.campaignId;
    delete persistenceData.createdAt;

    // Always update the updatedAt timestamp
    persistenceData.updatedAt = new Date();

    return persistenceData;
  }

  /**
   * Map domain criteria to persistence query criteria
   */
  toPersistenceCriteria(
    domainCriteria: Record<string, any>
  ): Record<string, any> {
    const persistenceCriteria: Record<string, any> = {};

    for (const [key, value] of Object.entries(domainCriteria)) {
      if (value === undefined) {
        continue;
      }

      // Map domain field names to persistence field names if needed
      switch (key) {
        case 'status':
          // Map status enum to approved boolean
          if (value === ApprovalStatus.APPROVED) {
            persistenceCriteria['approved'] = true;
          } else if (
            value === ApprovalStatus.PENDING ||
            value === ApprovalStatus.REJECTED
          ) {
            persistenceCriteria['approved'] = false;
          }
          break;

        case 'id':
        case 'campaignId':
        case 'milestones':
        case 'investorPitch':
        case 'isShowPitch':
        case 'investorPitchTitle':
        case 'approved':
        case 'submittedAt':
        case 'reviewedAt':
        case 'submittedBy':
        case 'reviewedBy':
        case 'comment':
        case 'createdAt':
        case 'updatedAt':
          // Direct field mapping
          persistenceCriteria[key] = value;
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
   * Map multiple models to domain entities
   */
  toDomainList(
    models: DashboardCampaignInfoModelAttributes[]
  ): DashboardCampaignInfo[] {
    return models.map(model => this.toDomain(model));
  }

  /**
   * Map approved boolean to domain status
   */
  private mapApprovalStatus(approved: boolean): ApprovalStatus {
    return approved ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING;
  }

  /**
   * Map domain status to approved boolean
   */
  private mapToApprovedBoolean(status: ApprovalStatus): boolean {
    return status === ApprovalStatus.APPROVED;
  }

  /**
   * Create persistence data for new entity creation
   */
  toNewPersistence(createData: {
    campaignId: string;
    milestones: string;
    investorPitch: string;
    isShowPitch: boolean;
    investorPitchTitle: string;
  }): Partial<DashboardCampaignInfoModelAttributes> {
    const now = new Date();

    return {
      id: randomUUID(),
      campaignId: createData.campaignId,
      milestones: createData.milestones,
      investorPitch: createData.investorPitch,
      isShowPitch: createData.isShowPitch,
      investorPitchTitle: createData.investorPitchTitle,
      approved: false, // Always start as not approved
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
      reviewedAt: null,
      submittedBy: null,
      reviewedBy: null,
      comment: null,
    };
  }

  /**
   * Map dashboard campaign info to campaign info table structure
   */
  toCampaignInfoPersistence(
    domain: DashboardCampaignInfo
  ): Record<string, any> {
    return {
      campaignInfoId: randomUUID(),
      campaignId: domain.campaignId,
      financialHistory: '', // Default empty, not provided in dashboard
      competitors: '', // Default empty, not provided in dashboard
      milestones: domain.milestones,
      investorPitch: domain.investorPitch,
      risks: '', // Default empty, not provided in dashboard
      target: null,
      isShowPitch: domain.isShowPitch,
      investorPitchTitle: domain.investorPitchTitle,
    };
  }
}
