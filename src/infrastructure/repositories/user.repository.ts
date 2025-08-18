import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { User } from '@/domain/user/entity/user.entity';

import { EventBus } from '@/infrastructure/events/event-bus';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { UserMapper } from '@/infrastructure/mappers/user.mapper';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';

import { UserModelAttributes } from '@/types/user';

import { BaseRepository } from './base.repository';

@injectable()
export class UserRepository extends BaseRepository<User, UserModelAttributes> {
  constructor(
    @inject(TOKENS.ORMAdapterToken)
    ormAdapter: IORMAdapter,
    @inject(UserMapper)
    protected readonly mapper: UserMapper,
    @inject(LoggerService) protected override readonly logger: LoggerService,
    @inject(EventBus) protected override readonly eventBus: EventBus
  ) {
    super('User', ormAdapter, logger, eventBus);
  }

  protected override toDomain(model: UserModelAttributes): User {
    return this.mapper.toDomain(model);
  }

  protected override toPersistence(domain: User): UserModelAttributes {
    return this.mapper.toPersistence(domain);
  }

  protected override getEntityName(): string {
    return 'User';
  }
}
