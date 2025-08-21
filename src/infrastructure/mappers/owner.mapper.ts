import { injectable } from 'tsyringe';

import { Owner } from '@/domain/owners/entity/owner.entity';

import { OwnerProps } from '@/types/owner';

interface OwnerModelAttributes {
  ownerId: string;
  title?: string;
  subTitle?: string | null;
  description?: string;
  primaryOwner?: boolean;
  beneficialOwner?: boolean;
  beneficialOwnerId?: string | null;
  businessOwner?: boolean | null;
  userId?: string;
}

@injectable()
export class OwnerMapper {
  toDomain(model: OwnerModelAttributes): Owner {
    const props: OwnerProps = {
      ...model,
    };
    return Owner.fromPersistence(props);
  }

  toPersistence(domain: Owner): OwnerModelAttributes {
    const props = domain.toObject();
    return {
      ...props,
    };
  }
}
