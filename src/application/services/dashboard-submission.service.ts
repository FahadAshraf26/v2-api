import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { ApprovalHistory } from '@/domain/approval-history/entity/approval-history.entity';
import { DashboardCampaignInfo } from '@/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';
import { DashboardCampaignSummary } from '@/domain/dashboard-campaign-summary/entity/dashboard-campaign-summary.entity';
import { DashboardSocials } from '@/domain/dashboard-socials/entity/dashboard-socials.entity';
import { DashboardItemSubmittedForReviewEvent } from '@/domain/submission/events/dashboard-item-submitted-for-review.event';

import { EventBus } from '@/infrastructure/events/event-bus';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { ApprovalHistoryRepository } from '@/infrastructure/repositories/approval-history.repository';
import { DashboardCampaignInfoRepository } from '@/infrastructure/repositories/dashboard-campaign-info.repository';
import { DashboardCampaignSummaryRepository } from '@/infrastructure/repositories/dashboard-campaign-summary.repository';
import { DashboardSocialsRepository } from '@/infrastructure/repositories/dashboard-socials.repository';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

@injectable()
export class DashboardSubmissionService {
  constructor(
    @inject(TOKENS.DashboardCampaignInfoRepositoryToken)
    private readonly dashboardCampaignInfoRepository: DashboardCampaignInfoRepository,
    @inject(TOKENS.DashboardCampaignSummaryRepositoryToken)
    private readonly dashboardCampaignSummaryRepository: DashboardCampaignSummaryRepository,
    @inject(TOKENS.DashboardSocialsRepositoryToken)
    private readonly dashboardSocialsRepository: DashboardSocialsRepository,
    @inject(ApprovalHistoryRepository)
    private readonly approvalHistoryRepository: ApprovalHistoryRepository,
    @inject(LoggerService) private readonly logger: LoggerService,
    @inject(EventBus) private readonly eventBus: EventBus
  ) {}

  async submitForReview(
    campaignId: string,
    userId: string,
    entityTypes: string[]
  ): Promise<Result<{ success: boolean }, Error>> {
    try {
      this.logger.info('Submitting dashboard items for review', {
        campaignId,
        userId,
        entityTypes,
      });

      const repositories: Record<
        string,
        | DashboardCampaignInfoRepository
        | DashboardCampaignSummaryRepository
        | DashboardSocialsRepository
      > = {
        'dashboard-campaign-info': this.dashboardCampaignInfoRepository,
        'dashboard-campaign-summary': this.dashboardCampaignSummaryRepository,
        'dashboard-socials': this.dashboardSocialsRepository,
      };

      for (const entityType of entityTypes) {
        const repository = repositories[entityType];
        if (!repository) {
          return Err(new Error(`Invalid entity type: ${entityType}`));
        }

        const findResult = await (repository as any).findOne({
          where: { campaignId },
        });

        if (findResult.isErr()) {
          return Err(findResult.unwrapErr());
        }

        const entity = findResult.unwrap();
        if (
          entity &&
          (entity.status === ApprovalStatus.DRAFT ||
            entity.status === ApprovalStatus.REJECTED)
        ) {
          const newStatus = ApprovalStatus.PENDING;
          entity.update({ status: newStatus });
          await repository.update(entity.id as string, entity as any);

          const approvalHistory = ApprovalHistory.create({
            entityId: entity.id,
            entityType,
            status: ApprovalStatus.PENDING,
            userId,
          });
          await this.approvalHistoryRepository.save(approvalHistory);
        }
      }

      this.eventBus.publish(
        new DashboardItemSubmittedForReviewEvent(
          campaignId,
          userId,
          entityTypes,
          new Date()
        )
      );

      return Ok({ success: true });
    } catch (error) {
      this.logger.error(
        'Error submitting dashboard items for review',
        error as Error
      );
      return Err(
        new Error(
          `Failed to submit dashboard items for review: ${
            (error as Error).message
          }`
        )
      );
    }
  }
}
