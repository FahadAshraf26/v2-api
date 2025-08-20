import { injectable } from 'tsyringe';

import { Issuer } from '@/domain/issuer/entity/issuer.entity';

import { IssuerModelAttributes } from '@/infrastructure/database/models/issuer.model';

import { IssuerProps } from '@/types/issuer';

@injectable()
export class IssuerMapper {
  toDomain(model: IssuerModelAttributes): Issuer {
    const props: IssuerProps = {
      ...model,
    };
    return Issuer.fromPersistence(props);
  }

  toPersistence(domain: Issuer): IssuerModelAttributes {
    const props = domain.toObject();
    return {
      ...props,
      website: props.website || null,
      description: props.description || null,
      facebook: props.facebook || null,
      linkedIn: props.linkedIn || null,
      twitter: props.twitter || null,
      instagram: props.instagram || null,
      pinterest: props.pinterest || null,
      reddit: props.reddit || null,
      tiktok: props.tiktok || null,
      yelp: props.yelp || null,
      EIN: props.EIN || null,
      city: props.city || null,
      state: props.state || null,
      zipCode: props.zipCode || null,
      phoneNumber: props.phoneNumber || null,
      latitude: props.latitude || null,
      longitude: props.longitude || null,
      previousName: props.previousName || null,
      ncIssuerId: props.ncIssuerId || null,
      country: props.country || null,
    };
  }

  toPersistenceCriteria<T extends Record<string, unknown>>(
    criteria: T
  ): Partial<T> {
    const persistenceCriteria: Partial<T> = {};
    for (const key in criteria) {
      if (key === 'id') {
        (persistenceCriteria as Record<string, unknown>)['issuerId'] =
          criteria[key];
      } else {
        persistenceCriteria[key] = criteria[key];
      }
    }
    return persistenceCriteria;
  }
}
