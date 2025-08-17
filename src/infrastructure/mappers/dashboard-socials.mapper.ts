import { injectable } from 'tsyringe';

import { DashboardSocials } from '@/domain/dashboard-socials/entity/dashboard-socials.entity';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import {
  DashboardSocialsModelAttributes,
  DashboardSocialsProps,
  DashboardSocialsWithApproval,
} from '@/types/dashboard-socials';

@injectable()
export class DashboardSocialsMapper {
  /**
   * Convert from persistence with approval to domain entity
   */
  toDomain(data: DashboardSocialsWithApproval): DashboardSocials {
    const props: DashboardSocialsProps = {
      id: data.socials.id,
      campaignId: data.socials.campaignId,
      linkedIn: data.socials.linkedIn || undefined,
      twitter: data.socials.twitter || undefined,
      instagram: data.socials.instagram || undefined,
      facebook: data.socials.facebook || undefined,
      tiktok: data.socials.tiktok || undefined,
      yelp: data.socials.yelp || undefined,
      status:
        (data.approval?.status as ApprovalStatus) || ApprovalStatus.PENDING,
      createdAt: data.socials.createdAt,
      updatedAt: data.socials.updatedAt,
      submittedAt: data.approval?.submittedAt,
      reviewedAt: data.approval?.reviewedAt,
      submittedBy: data.approval?.submittedBy,
      reviewedBy: data.approval?.reviewedBy,
      comment: data.approval?.comment,
    };

    return DashboardSocials.fromPersistence(props);
  }

  /**
   * Convert from simple model attributes to domain entity (without approval data)
   */
  toDomainFromModel(model: DashboardSocialsModelAttributes): DashboardSocials {
    const props: DashboardSocialsProps = {
      id: model.id,
      campaignId: model.campaignId,
      linkedIn: model.linkedIn || undefined,
      twitter: model.twitter || undefined,
      instagram: model.instagram || undefined,
      facebook: model.facebook || undefined,
      tiktok: model.tiktok || undefined,
      yelp: model.yelp || undefined,
      status: ApprovalStatus.PENDING,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };

    return DashboardSocials.fromPersistence(props);
  }

  /**
   * Convert from domain entity to persistence
   */
  toPersistence(domain: DashboardSocials): DashboardSocialsModelAttributes {
    const domainObject = domain.toObject();

    return {
      id: domainObject.id,
      campaignId: domainObject.campaignId,
      linkedIn: domainObject.linkedIn || null,
      twitter: domainObject.twitter || null,
      instagram: domainObject.instagram || null,
      facebook: domainObject.facebook || null,
      tiktok: domainObject.tiktok || null,
      yelp: domainObject.yelp || null,
      createdAt: domainObject.createdAt,
      updatedAt: domainObject.updatedAt,
    };
  }

  /**
   * Convert update data from domain to persistence
   */
  toPersistenceUpdate(
    domain: DashboardSocials
  ): Partial<DashboardSocialsModelAttributes> {
    const domainObject = domain.toObject();

    return {
      linkedIn: domainObject.linkedIn || null,
      twitter: domainObject.twitter || null,
      instagram: domainObject.instagram || null,
      facebook: domainObject.facebook || null,
      tiktok: domainObject.tiktok || null,
      yelp: domainObject.yelp || null,
      updatedAt: domainObject.updatedAt,
    };
  }

  /**
   * Convert search criteria from domain to persistence
   */
  toPersistenceCriteria(criteria: any): Record<string, any> {
    const persistenceCriteria: Record<string, any> = {};

    if (criteria['id']) {
      persistenceCriteria['id'] = criteria['id'];
    }
    if (criteria['campaignId']) {
      persistenceCriteria['campaignId'] = criteria['campaignId'];
    }

    return persistenceCriteria;
  }

  /**
   * Map from DTO to create props for issuers fallback
   */
  fromIssuerData(data: {
    linkedIn?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    yelp?: string;
  }): Partial<DashboardSocialsProps> {
    return {
      linkedIn: data.linkedIn,
      twitter: data.twitter,
      instagram: data.instagram,
      facebook: data.facebook,
      tiktok: data.tiktok,
      yelp: data.yelp,
    };
  }
}
