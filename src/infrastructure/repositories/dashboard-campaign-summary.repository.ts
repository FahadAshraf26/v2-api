import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { DashboardCampaignSummary } from '@/domain/dashboard-campaign-summary/entity/dashboard-campaign-summary.entity';

import { EventBus } from '@/infrastructure/events/event-bus';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { DashboardCampaignSummaryMapper } from '@/infrastructure/mappers/dashboard-campaign-summary.mapper';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import { DashboardCampaignSummaryModelAttributes } from '@/types/dashboard-campaign-summary';

import { BaseRepository } from './base.repository';

@injectable()
export class DashboardCampaignSummaryRepository extends BaseRepository<
  DashboardCampaignSummary,
  DashboardCampaignSummaryModelAttributes
> {
  constructor(
    @inject(TOKENS.ORMAdapterToken)
    ormAdapter: IORMAdapter,
    @inject(DashboardCampaignSummaryMapper)
    public readonly mapper: DashboardCampaignSummaryMapper,
    @inject(LoggerService) logger: LoggerService,
    @inject(EventBus) eventBus: EventBus
  ) {
    super('DashboardCampaignSummary', ormAdapter, logger, eventBus);
  }

  /**
   * Find dashboard campaign summary by campaign slug
   */
  async findByCampaignSlug(
    slug: string
  ): Promise<Result<DashboardCampaignSummary | null, Error>> {
    try {
      const result = await this.findOne({
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

      const entity = result.unwrap();

      return Ok(
        entity
          ? this.toDomain(entity as DashboardCampaignSummaryModelAttributes)
          : null
      );
    } catch (error) {
      return this.handleRepositoryError(error);
    }
  }

  protected toDomain(
    model: DashboardCampaignSummaryModelAttributes
  ): DashboardCampaignSummary {
    return this.mapper.toDomain(model);
  }

  protected toPersistence(
    domain: DashboardCampaignSummary
  ): Record<string, unknown> {
    return this.mapper.toPersistence(domain) as unknown as Record<
      string,
      unknown
    >;
  }

  protected getEntityName(): string {
    return 'DashboardCampaignSummary';
  }

  /**
   * Creates a new dashboard campaign summary or updates an existing one based on approval status.
   */
  async createOrUpdate(
    dashboardSummary: DashboardCampaignSummary
  ): Promise<Result<DashboardCampaignSummary, Error>> {
    try {
      const { campaignId } = dashboardSummary;
      this.logger.info('Creating or updating dashboard campaign summary', {
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
          // The incoming `dashboardSummary` entity always has DRAFT status, so we must override it.
          let newStatus = existing.status;
          if (existing.status === ApprovalStatus.REJECTED) {
            newStatus = ApprovalStatus.PENDING;
          }
          dashboardSummary.update({ status: newStatus as ApprovalStatus });

          const updated = await this.update(
            existing.id as string,
            dashboardSummary
          );

          if (updated.isErr()) {
            return updated;
          }

          return updated;
        } else if (status === ApprovalStatus.APPROVED) {
          return Err(
            new Error(
              'Cannot update dashboard campaign summary that is already approved.'
            )
          );
        }
      }

      // Create new record
      return await this.save(dashboardSummary);
    } catch (error) {
      this.logger.error(
        'Error creating or updating dashboard campaign summary',
        error as Error
      );
      return Err(
        new Error(
          `Failed to create or update dashboard campaign summary: ${
            (error as Error).message
          }`
        )
      );
    }
  }
}
