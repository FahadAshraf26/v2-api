import { injectable, inject } from 'tsyringe';
import { Result, Ok, Err } from 'oxide.ts';
import { BaseRepository } from './base.repository';
import { DashboardCampaignInfo } from '@/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';
import { DashboardCampaignInfoModelAttributes } from '@/types/dashboard-campaign-info';
import { DashboardCampaignInfoMapper } from '@/infrastructure/mappers/dashboard-campaign-info.mapper';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { EventBus } from '@/infrastructure/events/event-bus';
import { TOKENS } from '@/config/dependency-injection';

@injectable()
export class DashboardCampaignInfoRepository extends BaseRepository<
  DashboardCampaignInfo,
  DashboardCampaignInfoModelAttributes
> {
  constructor(
    @inject(TOKENS.ORMAdapterToken) ormAdapter: IORMAdapter,
    @inject(LoggerService) logger: LoggerService,
    @inject(EventBus) eventBus: EventBus,
    @inject(DashboardCampaignInfoMapper)
    private readonly mapper: DashboardCampaignInfoMapper
  ) {
    super('DashboardCampaignInfo', ormAdapter, logger, eventBus);
  }

  protected getEntityName(): string {
    return 'DashboardCampaignInfo';
  }

  protected toDomain(
    model: DashboardCampaignInfoModelAttributes
  ): DashboardCampaignInfo {
    return this.mapper.toDomain(model);
  }

  protected toPersistence(domain: DashboardCampaignInfo): any {
    return this.mapper.toPersistence(domain);
  }

  /**
   * Override the base mapDomainCriteriaToPersistence to use mapper
   */
  protected override mapDomainCriteriaToPersistence(
    criteria: any
  ): Record<string, any> {
    return this.mapper.toPersistenceCriteria(criteria);
  }

  /**
   * Override the base mapDomainUpdatesToPersistence to use mapper
   */
  protected override mapDomainUpdatesToPersistence(
    updates: Partial<DashboardCampaignInfo>
  ): Record<string, any> {
    // For updates, we need to create a temporary domain entity to use the mapper
    // This is a bit of a workaround, but ensures consistency
    if (updates instanceof DashboardCampaignInfo) {
      return this.mapper.toPersistenceUpdate(updates);
    }

    // If it's just partial data, use the base implementation
    return super.mapDomainUpdatesToPersistence(updates);
  }

  /**
   * Find dashboard campaign info by campaign ID
   */
  async findByCampaignId(
    campaignId: string
  ): Promise<Result<DashboardCampaignInfo | null, Error>> {
    try {
      this.logger.debug('Finding dashboard campaign info by campaignId', {
        campaignId,
      });

      const queryBuilder = this.createQueryBuilder();
      const result = await queryBuilder.where({ campaignId }).first();

      if (!result) {
        return Ok(null);
      }

      const domain = this.mapper.toDomain(result);
      return Ok(domain);
    } catch (error) {
      this.logger.error(
        'Error finding dashboard campaign info by campaignId',
        error as Error
      );
      return Err(
        new Error(
          `Failed to find dashboard campaign info: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Find all pending dashboard campaign infos for admin review
   */
  async findPendingForReview(): Promise<
    Result<DashboardCampaignInfo[], Error>
  > {
    try {
      this.logger.debug('Finding pending dashboard campaign infos for review');

      const queryBuilder = this.createQueryBuilder();
      const results = await queryBuilder
        .where({ approved: false })
        .whereNotNull('submittedAt')
        .orderBy('submittedAt', 'ASC')
        .execute();

      const domains = this.mapper.toDomainList(results);
      return Ok(domains);
    } catch (error) {
      this.logger.error(
        'Error finding pending dashboard campaign infos',
        error as Error
      );
      return Err(
        new Error(`Failed to find pending items: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Find dashboard campaign infos by submitter
   */
  async findBySubmittedBy(
    userId: string
  ): Promise<Result<DashboardCampaignInfo[], Error>> {
    try {
      this.logger.debug('Finding dashboard campaign infos by submittedBy', {
        userId,
      });

      const queryBuilder = this.createQueryBuilder();
      const results = await queryBuilder
        .where({ submittedBy: userId })
        .orderBy('updatedAt', 'DESC')
        .execute();

      const domains = this.mapper.toDomainList(results);
      return Ok(domains);
    } catch (error) {
      this.logger.error(
        'Error finding dashboard campaign infos by submittedBy',
        error as Error
      );
      return Err(
        new Error(
          `Failed to find items by submitter: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Move approved data to campaignInfos table
   */
  async moveToApprovedTable(
    dashboardInfo: DashboardCampaignInfo
  ): Promise<Result<void, Error>> {
    try {
      this.logger.info(
        'Moving approved dashboard campaign info to campaignInfos table',
        {
          id: dashboardInfo.id,
          campaignId: dashboardInfo.campaignId,
        }
      );

      // Start transaction
      return await this.transaction(async transaction => {
        // Use mapper to convert to campaignInfo structure
        const campaignInfoData =
          this.mapper.toCampaignInfoPersistence(dashboardInfo);

        // Insert into campaignInfos table
        await this.ormAdapter.create('CampaignInfo', campaignInfoData, {
          transaction,
        });

        this.logger.info(
          'Successfully moved dashboard campaign info to campaignInfos table',
          {
            dashboardId: dashboardInfo.id,
            campaignId: dashboardInfo.campaignId,
          }
        );

        return Ok(undefined);
      });
    } catch (error) {
      this.logger.error(
        'Error moving dashboard campaign info to approved table',
        error as Error
      );
      return Err(
        new Error(
          `Failed to move to approved table: ${(error as Error).message}`
        )
      );
    }
  }
}
