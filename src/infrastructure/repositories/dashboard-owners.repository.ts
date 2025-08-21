import { Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { DashboardOwners } from '@/domain/dashboard-owners/entity/dashboard-owners.entity';

import { EventBus } from '@/infrastructure/events/event-bus';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { DashboardOwnersMapper } from '@/infrastructure/mappers/dashboard-owners.mapper';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import { BaseRepository } from './base.repository';

interface DashboardOwnersModelAttributes {
  id: string;
  campaignId: string;
  name: string;
  position: string;
  description: string;
  ownerId?: string;
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
export class DashboardOwnersRepository extends BaseRepository<
  DashboardOwners,
  DashboardOwnersModelAttributes
> {
  constructor(
    @inject(TOKENS.ORMAdapterToken)
    ormAdapter: IORMAdapter,
    @inject(DashboardOwnersMapper)
    public readonly mapper: DashboardOwnersMapper,
    @inject(LoggerService) logger: LoggerService,
    @inject(EventBus) eventBus: EventBus
  ) {
    super('DashboardOwners', ormAdapter, logger, eventBus);
  }

  async findByCampaignSlug(
    slug: string
  ): Promise<Result<DashboardOwners[] | null, Error>> {
    try {
      const result = await this.findMany({
        include: [
          {
            relation: 'campaign',
            where: { slug },
            required: true,
          },
        ],
      });
      if (result.isErr()) {
        return result;
      }
      const entities = result.unwrap();
      return Ok(
        entities
          ? entities.map((entity: DashboardOwners) =>
              this.toDomain(entity as unknown as DashboardOwnersModelAttributes)
            )
          : null
      );
    } catch (error) {
      return this.handleRepositoryError(error);
    }
  }

  protected toDomain(model: DashboardOwnersModelAttributes): DashboardOwners {
    return this.mapper.toDomain(model);
  }

  protected toPersistence(domain: DashboardOwners): Record<string, unknown> {
    return this.mapper.toPersistence(domain) as unknown as Record<
      string,
      unknown
    >;
  }

  protected getEntityName(): string {
    return 'DashboardOwners';
  }
}
