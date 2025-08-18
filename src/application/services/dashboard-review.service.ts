import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { ApprovalHistory } from '@/domain/approval-history/entity/approval-history.entity';
import { DashboardCampaignInfo } from '@/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';
import { DashboardCampaignSummary } from '@/domain/dashboard-campaign-summary/entity/dashboard-campaign-summary.entity';
import { DashboardSocials } from '@/domain/dashboard-socials/entity/dashboard-socials.entity';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';
import { ApprovalHistoryRepository } from '@/infrastructure/repositories/approval-history.repository';
import { CampaignInfoRepository } from '@/infrastructure/repositories/campaign-info.repository';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';
import { DashboardCampaignInfoRepository } from '@/infrastructure/repositories/dashboard-campaign-info.repository';
import { DashboardCampaignSummaryRepository } from '@/infrastructure/repositories/dashboard-campaign-summary.repository';
import { DashboardSocialsRepository } from '@/infrastructure/repositories/dashboard-socials.repository';
import { IssuerRepository } from '@/infrastructure/repositories/issuer.repository';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import { ReviewSubmissionDto } from '@/types/dashboard-submission';

type DashboardEntity =
  | DashboardCampaignInfo
  | DashboardCampaignSummary
  | DashboardSocials;

type DashboardRepository =
  | DashboardCampaignInfoRepository
  | DashboardCampaignSummaryRepository
  | DashboardSocialsRepository;

@injectable()
export class DashboardReviewService {
  private readonly repositories: Record<string, DashboardRepository>;

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
    @inject(TOKENS.ORMAdapterToken) private readonly ormAdapter: IORMAdapter,
    @inject(TOKENS.CampaignRepositoryToken)
    private readonly campaignRepository: CampaignRepository,
    @inject(TOKENS.CampaignInfoRepositoryToken)
    private readonly campaignInfoRepository: CampaignInfoRepository,
    @inject(TOKENS.IssuerRepositoryToken)
    private readonly issuerRepository: IssuerRepository
  ) {
    this.repositories = {
      'dashboard-campaign-info': this.dashboardCampaignInfoRepository,
      'dashboard-campaign-summary': this.dashboardCampaignSummaryRepository,
      'dashboard-socials': this.dashboardSocialsRepository,
    };
  }

  async reviewSubmission({
    campaignId,
    adminId,
    entityTypes,
    action,
    comment,
  }: ReviewSubmissionDto): Promise<Result<void, Error>> {
    try {
      this.logger.info('Reviewing dashboard submission', {
        campaignId,
        adminId,
        entityTypes,
        action,
      });

      const newStatus =
        action === 'approve'
          ? ApprovalStatus.APPROVED
          : ApprovalStatus.REJECTED;

      for (const entityType of entityTypes) {
        const repository = this.repositories[entityType];
        if (!repository) {
          return Err(new Error(`Invalid entity type: ${entityType}`));
        }

        const findResult = await (repository as any).findOne({
          where: { campaignId },
        });

        if (findResult.isErr()) {
          return Err(findResult.unwrapErr());
        }

        const entity = findResult.unwrap() as DashboardEntity | null;

        if (!entity) {
          this.logger.warn(
            `No entity found for type ${entityType} and campaign ${campaignId}`
          );
          continue;
        }

        if (entity.status !== ApprovalStatus.PENDING) {
          return Err(
            new Error(
              `Entity ${entityType} for campaign ${campaignId} is not in PENDING state.`
            )
          );
        }

        (entity as any).update({ status: newStatus });
        await repository.update(entity.id as string, entity as any);

        const approvalHistory = ApprovalHistory.create({
          entityId: entity.id as string,
          entityType,
          status: newStatus,
          userId: adminId,
          comment: comment || null,
        });
        await this.approvalHistoryRepository.save(approvalHistory);

        if (newStatus === ApprovalStatus.APPROVED) {
          await this.moveApprovedData(entity, entityType);
        }
      }

      return Ok(undefined);
    } catch (error) {
      this.logger.error('Error reviewing dashboard submission', error as Error);
      return Err(
        new Error(
          `Failed to review dashboard submission: ${(error as Error).message}`
        )
      );
    }
  }

  private async moveApprovedData(
    entity: DashboardEntity,
    entityType: string
  ): Promise<Result<void, Error>> {
    try {
      this.logger.info('Moving approved data to main tables', {
        entityId: entity.id,
        entityType,
      });

      if (
        entityType === 'dashboard-campaign-info' &&
        entity instanceof DashboardCampaignInfo
      ) {
        const campaignInfoData =
          this.dashboardCampaignInfoRepository.mapper.toCampaignInfoPersistence(
            entity
          );

        const existingCampaignInfo = await this.campaignInfoRepository.findOne({
          where: { campaignId: entity.campaignId },
        });

        if (existingCampaignInfo.isOk() && existingCampaignInfo.unwrap()) {
          await this.campaignInfoRepository.update(
            existingCampaignInfo.unwrap()!.id as string,
            campaignInfoData as any
          );
        } else {
          await this.campaignInfoRepository.save(campaignInfoData as any);
        }
      } else if (
        entityType === 'dashboard-campaign-summary' &&
        entity instanceof DashboardCampaignSummary
      ) {
        const campaignData =
          this.dashboardCampaignSummaryRepository.mapper.toCampaignPersistence(
            entity
          );
        await this.campaignRepository.update(
          entity.campaignId,
          campaignData as any
        );
      } else if (
        entityType === 'dashboard-socials' &&
        entity instanceof DashboardSocials
      ) {
        const issuerData =
          this.dashboardSocialsRepository.mapper.toIssuerPersistence(entity);

        const campaign = await this.campaignRepository.findOne({
          where: { campaignId: entity.campaignId },
        });

        if (campaign.isOk() && campaign.unwrap()) {
          const issuerId = campaign.unwrap()!.issuerId;
          if (issuerId) {
            await this.issuerRepository.update(issuerId, issuerData as any);
          }
        }
      }

      return Ok(undefined);
    } catch (error) {
      this.logger.error('Error moving approved data', error as Error);
      return Err(
        new Error(`Failed to move approved data: ${(error as Error).message}`)
      );
    }
  }
}
