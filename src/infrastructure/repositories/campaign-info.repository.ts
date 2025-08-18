import { Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { CampaignInfo } from '@/domain/campaign-info/entity/campaign-info.entity';

import { CampaignInfoModelAttributes } from '@/infrastructure/database/models/campaign-info.model';
import { EventBus } from '@/infrastructure/events/event-bus';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { CampaignInfoMapper } from '@/infrastructure/mappers/campaign-info.mapper';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';

import { BaseRepository } from './base.repository';

@injectable()
export class CampaignInfoRepository extends BaseRepository<
  CampaignInfo,
  CampaignInfoModelAttributes
> {
  constructor(
    @inject(TOKENS.ORMAdapterToken)
    ormAdapter: IORMAdapter,
    @inject(CampaignInfoMapper)
    private readonly mapper: CampaignInfoMapper,
    @inject(LoggerService) logger: LoggerService,
    @inject(EventBus) eventBus: EventBus
  ) {
    super('CampaignInfo', ormAdapter, logger, eventBus);
  }

  protected toDomain(model: CampaignInfoModelAttributes): CampaignInfo {
    return this.mapper.toDomain(model);
  }

  protected toPersistence(domain: CampaignInfo): CampaignInfoModelAttributes {
    return this.mapper.toPersistence(domain);
  }

  protected getEntityName(): string {
    return 'CampaignInfo';
  }

  override async findOne(
    criteria: any
  ): Promise<Result<CampaignInfo | null, Error>> {
    return super.findOne(criteria);
  }

  override async update(
    id: string,
    updates: Partial<CampaignInfo>
  ): Promise<Result<CampaignInfo, Error>> {
    return super.update(id, updates);
  }

  override async save(
    entity: CampaignInfo
  ): Promise<Result<CampaignInfo, Error>> {
    return super.save(entity);
  }
}
