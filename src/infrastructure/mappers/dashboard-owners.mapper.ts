import { injectable } from 'tsyringe';

import { DashboardOwners } from '@/domain/dashboard-owners/entity/dashboard-owners.entity';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import {
  DashboardOwnerDto,
  DashboardOwnersProps,
} from '@/types/dashboard-owners';
import { OwnerProps } from '@/types/owner';

interface DashboardOwnersModelAttributes {
  id: string;
  campaignId: string;
  name: string | null;
  position: string | null;
  description: string | null;
  ownerId?: string | null;
  status: ApprovalStatus;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  submittedBy?: string;
  reviewedBy?: string;
  comment?: string;
}

@injectable()
export class DashboardOwnersMapper {
  toDomain(model: DashboardOwnersModelAttributes): DashboardOwners {
    const { ownerId, ...rest } = model;
    const props: DashboardOwnersProps = {
      ...rest,
      status: model.status as ApprovalStatus,
      name: model.name || '',
      position: model.position || '',
      description: model.description || '',
    };
    if (ownerId) {
      props.ownerId = ownerId;
    }
    return DashboardOwners.fromPersistence(props);
  }

  toDTO(domain: DashboardOwners): DashboardOwnerDto {
    const props = domain.toObject();
    return {
      id: props.id,
      campaignId: props.campaignId,
      name: props.name ?? null,
      position: props.position ?? null,
      description: props.description ?? null,
      status: props.status,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  toDomainFromModel(model: DashboardOwnersModelAttributes): DashboardOwners {
    const props: DashboardOwnersProps = {
      id: model.id,
      campaignId: model.campaignId,
      name: model.name || '',
      position: model.position || '',
      description: model.description || '',
      status: ApprovalStatus.PENDING,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
    return DashboardOwners.fromPersistence(props);
  }

  toPersistence(domain: DashboardOwners): DashboardOwnersModelAttributes {
    const props = domain.toObject();
    return {
      ...props,
      name: props.name || null,
      position: props.position || null,
      description: props.description || null,
    };
  }

  toPersistenceUpdate(
    domain: DashboardOwners
  ): Partial<DashboardOwnersModelAttributes> {
    const domainObject = domain.toObject();
    return {
      name: domainObject.name || null,
      position: domainObject.position || null,
      description: domainObject.description || null,
      updatedAt: domainObject.updatedAt,
    };
  }

  toPersistenceCriteria(
    criteria: Partial<DashboardOwnersProps>
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

  toOwnerPersistence(domain: DashboardOwners): OwnerProps {
    const props = domain.toObject();
    return {
      ownerId: props.ownerId || '',
      title: props.name,
      subTitle: props.position,
      description: props.description,
    };
  }
}
