import { Err, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { DashboardCampaignInfo } from '@/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';

import { EventBus } from '@/infrastructure/events/event-bus';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { DashboardCampaignInfoMapper } from '@/infrastructure/mappers/dashboard-campaign-info.mapper';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import { DashboardCampaignInfoModelAttributes } from '@/types/dashboard-campaign-info';

import { BaseRepository } from './base.repository';

@injectable()
export class DashboardCampaignInfoRepository extends BaseRepository<
  DashboardCampaignInfo,
  DashboardCampaignInfoModelAttributes
> {
  constructor(
    @inject(TOKENS.ORMAdapterToken)
    ormAdapter: IORMAdapter,
    @inject(DashboardCampaignInfoMapper)
    public readonly mapper: DashboardCampaignInfoMapper,
    @inject(LoggerService) logger: LoggerService,
    @inject(EventBus) eventBus: EventBus
  ) {
    super('DashboardCampaignInfo', ormAdapter, logger, eventBus);
  }

  protected toDomain(
    model: DashboardCampaignInfoModelAttributes
  ): DashboardCampaignInfo {
    return this.mapper.toDomain(model);
  }

  protected toPersistence(
    domain: DashboardCampaignInfo
  ): DashboardCampaignInfoModelAttributes {
    return this.mapper.toPersistence(domain);
  }

  protected getEntityName(): string {
    return 'DashboardCampaignInfo';
  }

  /**
   * Creates a new dashboard campaign info or updates an existing one based on approval status.
   */
  async createOrUpdate(
    dashboardInfo: DashboardCampaignInfo
  ): Promise<Result<DashboardCampaignInfo, Error>> {
    try {
      const { campaignId } = dashboardInfo;
      this.logger.info('Creating or updating dashboard campaign info', {
        campaignId,
      });

      // Check for existing record
      const existingResult = await this.findOne({
        where: { campaignId },
      });

      if (existingResult.isErr()) {
        return Err(existingResult.unwrapErr());
      }
      const existing = existingResult.unwrap();

      if (existing) {
        // Check approval status
        const status = existing.status;

        if (
          status === ApprovalStatus.DRAFT ||
          status === ApprovalStatus.PENDING ||
          status === ApprovalStatus.REJECTED
        ) {
          // Preserve the existing status, unless it's a REJECTED -> PENDING transition.
          // The incoming `dashboardInfo` entity always has DRAFT status, so we must override it.
          let newStatus = existing.status;
          if (existing.status === ApprovalStatus.REJECTED) {
            newStatus = ApprovalStatus.PENDING;
          }
          dashboardInfo.update({ status: newStatus });

          const updated = await this.update(
            existing.id as string,
            dashboardInfo
          );

          if (updated.isErr()) {
            return updated;
          }

          return updated;
        } else if (status === ApprovalStatus.APPROVED) {
          return Err(
            new Error(
              'Cannot update dashboard campaign info that is already approved.'
            )
          );
        }
      }

      // Create new record
      return await this.save(dashboardInfo);
    } catch (error) {
      this.logger.error(
        'Error creating or updating dashboard campaign info',
        error as Error
      );
      return Err(
        new Error(
          `Failed to create or update dashboard campaign info: ${
            (error as Error).message
          }`
        )
      );
    }
  }
}
