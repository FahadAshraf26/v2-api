import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { ApprovalHistory } from '@/domain/approval-history/entity/approval-history.entity';

import { EventBus } from '@/infrastructure/events/event-bus';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { ApprovalHistoryMapper } from '@/infrastructure/mappers/approval-history.mapper';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';

import { ApprovalHistoryModelAttributes } from '@/types/approval-history';

import { BaseRepository } from './base.repository';

@injectable()
export class ApprovalHistoryRepository extends BaseRepository<
  ApprovalHistory,
  ApprovalHistoryModelAttributes
> {
  constructor(
    @inject(TOKENS.ORMAdapterToken)
    protected override readonly ormAdapter: IORMAdapter,
    @inject(ApprovalHistoryMapper)
    protected readonly mapper: ApprovalHistoryMapper,
    @inject(LoggerService) protected override readonly logger: LoggerService,
    @inject(EventBus) protected override readonly eventBus: EventBus
  ) {
    super('ApprovalHistory', ormAdapter, logger, eventBus);
  }

  protected override toDomain(
    model: ApprovalHistoryModelAttributes
  ): ApprovalHistory {
    return this.mapper.toDomain(model);
  }

  protected override toPersistence(
    domain: ApprovalHistory
  ): Record<string, unknown> {
    return this.mapper.toPersistence(domain) as unknown as Record<
      string,
      unknown
    >;
  }

  protected override getEntityName(): string {
    return 'ApprovalHistory';
  }
}
