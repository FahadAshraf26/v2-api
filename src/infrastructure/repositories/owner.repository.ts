import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { Owner } from '@/domain/owners/entity/owner.entity';

import { EventBus } from '@/infrastructure/events/event-bus';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { OwnerMapper } from '@/infrastructure/mappers/owner.mapper';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';

import { OwnerProps } from '@/types/owner';

import { OwnerModelAttributes } from '../database/models/owner.model';
import { BaseRepository } from './base.repository';

@injectable()
export class OwnerRepository extends BaseRepository<Owner, OwnerProps> {
  constructor(
    @inject(TOKENS.ORMAdapterToken)
    ormAdapter: IORMAdapter,
    @inject(OwnerMapper)
    protected readonly mapper: OwnerMapper,
    @inject(LoggerService) protected override readonly logger: LoggerService,
    @inject(EventBus) protected override readonly eventBus: EventBus
  ) {
    super('Owner', ormAdapter, logger, eventBus);
  }

  protected override toDomain(model: OwnerModelAttributes): Owner {
    return this.mapper.toDomain(model);
  }

  protected override toPersistence(domain: Owner): Record<string, unknown> {
    return this.mapper.toPersistence(domain) as unknown as Record<
      string,
      unknown
    >;
  }

  protected override getEntityName(): string {
    return 'Owner';
  }
}
