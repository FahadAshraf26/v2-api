import { Err, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { DashboardSocials } from '@/domain/dashboard-socials/entity/dashboard-socials.entity';

import { EventBus } from '@/infrastructure/events/event-bus';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { DashboardSocialsMapper } from '@/infrastructure/mappers/dashboard-socials.mapper';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import { DashboardSocialsModelAttributes } from '@/types/dashboard-socials';

import { BaseRepository } from './base.repository';

@injectable()
export class DashboardSocialsRepository extends BaseRepository<
  DashboardSocials,
  DashboardSocialsModelAttributes
> {
  constructor(
    @inject(TOKENS.ORMAdapterToken)
    ormAdapter: IORMAdapter,
    @inject(DashboardSocialsMapper)
    public readonly mapper: DashboardSocialsMapper,
    @inject(LoggerService) logger: LoggerService,
    @inject(EventBus) eventBus: EventBus
  ) {
    super('DashboardSocials', ormAdapter, logger, eventBus);
  }

  protected toDomain(model: DashboardSocialsModelAttributes): DashboardSocials {
    return this.mapper.toDomain(model);
  }

  protected toPersistence(
    domain: DashboardSocials
  ): DashboardSocialsModelAttributes {
    return this.mapper.toPersistence(domain);
  }

  protected getEntityName(): string {
    return 'DashboardSocials';
  }

  /**
   * Creates a new dashboard socials or updates an existing one based on approval status.
   */
  async createOrUpdate(
    dashboardSocials: DashboardSocials
  ): Promise<Result<DashboardSocials, Error>> {
    try {
      const { campaignId } = dashboardSocials;
      this.logger.info('Creating or updating dashboard socials', {
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
          // The incoming `dashboardSocials` entity always has DRAFT status, so we must override it.
          let newStatus = existing.status;
          if (existing.status === ApprovalStatus.REJECTED) {
            newStatus = ApprovalStatus.PENDING;
          }
          dashboardSocials.update({ status: newStatus });

          const updated = await this.update(
            existing?.id as string,
            dashboardSocials
          );

          if (updated.isErr()) {
            return updated;
          }

          return updated;
        } else if (status === ApprovalStatus.APPROVED) {
          return Err(
            new Error(
              'Cannot update dashboard socials that is already approved.'
            )
          );
        }
      }

      // Create new record
      return await this.save(dashboardSocials);
    } catch (error) {
      this.logger.error(
        'Error creating or updating dashboard socials',
        error as Error
      );
      return Err(
        new Error(
          `Failed to create or update dashboard socials: ${
            (error as Error).message
          }`
        )
      );
    }
  }
}
