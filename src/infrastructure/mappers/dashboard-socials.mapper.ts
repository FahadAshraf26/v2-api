import { injectable } from 'tsyringe';

import { DashboardSocials } from '@/domain/dashboard-socials/entity/dashboard-socials.entity';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import {
  DashboardSocialsDto,
  DashboardSocialsModelAttributes,
  DashboardSocialsProps,
} from '@/types/dashboard-socials';
import { IssuerProps } from '@/types/issuer';

@injectable()
export class DashboardSocialsMapper {
  /**
   * Convert from persistence with approval to domain entity
   */
  toDomain(model: DashboardSocialsModelAttributes): DashboardSocials {
    const props: DashboardSocialsProps = {
      ...model,
      status: model.status as ApprovalStatus,
      linkedIn: model.linkedIn || undefined,
      twitter: model.twitter || undefined,
      instagram: model.instagram || undefined,
      facebook: model.facebook || undefined,
      tiktok: model.tiktok || undefined,
      yelp: model.yelp || undefined,
    };
    return DashboardSocials.fromPersistence(props);
  }

  toDTO(domain: DashboardSocials): DashboardSocialsDto {
    const props = domain.toObject();
    return {
      id: props.id,
      campaignId: props.campaignId,
      linkedIn: props.linkedIn ?? null,
      twitter: props.twitter ?? null,
      instagram: props.instagram ?? null,
      facebook: props.facebook ?? null,
      tiktok: props.tiktok ?? null,
      yelp: props.yelp ?? null,
      status: props.status,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
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
    const props = domain.toObject();
    return {
      ...props,
      linkedIn: props.linkedIn || null,
      twitter: props.twitter || null,
      instagram: props.instagram || null,
      facebook: props.facebook || null,
      tiktok: props.tiktok || null,
      yelp: props.yelp || null,
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
  toPersistenceCriteria(
    criteria: Partial<DashboardSocialsProps>
  ): Record<string, unknown> {
    const persistenceCriteria: Record<string, unknown> = {};

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

  /**
   * Convert from domain entity to persistence for business data only
   */
  toBusinessPersistence(
    domain: DashboardSocials
  ): DashboardSocialsModelAttributes {
    return this.toPersistence(domain);
  }

  /**
   * Convert from domain entity to persistence for business data only
   */
  toDomainFromBusinessData(
    model: DashboardSocialsModelAttributes
  ): DashboardSocials {
    return this.toDomainFromModel(model);
  }

  /**
   * Convert search criteria from domain to persistence for business data only
   */
  toBusinessPersistenceCriteria(
    criteria: Partial<DashboardSocialsProps>
  ): Record<string, unknown> {
    return this.toPersistenceCriteria(criteria);
  }

  /**
   * Convert update data from domain to persistence for business data only
   */
  toBusinessPersistenceUpdate(
    domain: DashboardSocials
  ): Partial<DashboardSocialsModelAttributes> {
    return this.toPersistenceUpdate(domain);
  }

  toIssuerPersistence(domain: DashboardSocials): Partial<IssuerProps> {
    const { campaignId, ...rest } = domain.toObject();
    return {
      ...rest,
      issuerId: campaignId,
      linkedIn: rest.linkedIn || null,
      twitter: rest.twitter || null,
      instagram: rest.instagram || null,
      facebook: rest.facebook || null,
      tiktok: rest.tiktok || null,
      yelp: rest.yelp || null,
      issuerName: '',
      physicalAddress: '',
      businessType: '',
      legalEntityType: '',
      email: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
