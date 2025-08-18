import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { Issuer } from '@/domain/issuer/entity/issuer.entity';

import { IssuerModelAttributes } from '@/infrastructure/database/models/issuer.model';
import { EventBus } from '@/infrastructure/events/event-bus';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { IssuerMapper } from '@/infrastructure/mappers/issuer.mapper';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';

import { BaseRepository } from './base.repository';

@injectable()
export class IssuerRepository extends BaseRepository<
  Issuer,
  IssuerModelAttributes
> {
  constructor(
    @inject(TOKENS.ORMAdapterToken)
    ormAdapter: IORMAdapter,
    @inject(IssuerMapper)
    private readonly mapper: IssuerMapper,
    @inject(LoggerService) logger: LoggerService,
    @inject(EventBus) eventBus: EventBus
  ) {
    super('Issuer', ormAdapter, logger, eventBus);
  }

  protected toDomain(model: IssuerModelAttributes): Issuer {
    return this.mapper.toDomain(model);
  }

  protected toPersistence(domain: Issuer): IssuerModelAttributes {
    return this.mapper.toPersistence(domain);
  }

  protected getEntityName(): string {
    return 'Issuer';
  }
}
