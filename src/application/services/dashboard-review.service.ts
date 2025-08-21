import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { ApprovalHistory } from '@/domain/approval-history/entity/approval-history.entity';
import { CampaignInfo } from '@/domain/campaign-info/entity/campaign-info.entity';
import { DashboardCampaignInfo } from '@/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';
import { DashboardCampaignSummary } from '@/domain/dashboard-campaign-summary/entity/dashboard-campaign-summary.entity';
import { DashboardOwners } from '@/domain/dashboard-owners/entity/dashboard-owners.entity';
import { DashboardSocials } from '@/domain/dashboard-socials/entity/dashboard-socials.entity';
import { Owner } from '@/domain/owners/entity/owner.entity';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';
import { ApprovalHistoryRepository } from '@/infrastructure/repositories/approval-history.repository';
import { CampaignInfoRepository } from '@/infrastructure/repositories/campaign-info.repository';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';
import { DashboardCampaignInfoRepository } from '@/infrastructure/repositories/dashboard-campaign-info.repository';
import { DashboardCampaignSummaryRepository } from '@/infrastructure/repositories/dashboard-campaign-summary.repository';
import { DashboardOwnersRepository } from '@/infrastructure/repositories/dashboard-owners.repository';
import { DashboardSocialsRepository } from '@/infrastructure/repositories/dashboard-socials.repository';
import { IssuerRepository } from '@/infrastructure/repositories/issuer.repository';
import { OwnerRepository } from '@/infrastructure/repositories/owner.repository';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import { CampaignInfoProps } from '@/types/campaign-info';
import { ReviewSubmissionDto } from '@/types/dashboard-submission';

@injectable()
export class DashboardReviewService {
  constructor(
    @inject(TOKENS.DashboardCampaignInfoRepositoryToken)
    private readonly dashboardCampaignInfoRepository: DashboardCampaignInfoRepository,
    @inject(TOKENS.DashboardCampaignSummaryRepositoryToken)
    private readonly dashboardCampaignSummaryRepository: DashboardCampaignSummaryRepository,
    @inject(TOKENS.DashboardSocialsRepositoryToken)
    private readonly dashboardSocialsRepository: DashboardSocialsRepository,
    @inject(DashboardOwnersRepository)
    private readonly dashboardOwnersRepository: DashboardOwnersRepository,
    @inject(ApprovalHistoryRepository)
    private readonly approvalHistoryRepository: ApprovalHistoryRepository,
    @inject(LoggerService) private readonly logger: LoggerService,
    @inject(TOKENS.ORMAdapterToken) private readonly ormAdapter: IORMAdapter,
    @inject(TOKENS.CampaignRepositoryToken)
    private readonly campaignRepository: CampaignRepository,
    @inject(TOKENS.CampaignInfoRepositoryToken)
    private readonly campaignInfoRepository: CampaignInfoRepository,
    @inject(TOKENS.IssuerRepositoryToken)
    private readonly issuerRepository: IssuerRepository,
    @inject(TOKENS.OwnerRepositoryToken)
    private readonly ownerRepository: OwnerRepository
  ) {}

  async reviewSubmission({
    campaignId,
    adminId,
    entityTypes,
    action,
    comment,
  }: ReviewSubmissionDto): Promise<Result<{ success: boolean }, Error>> {
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
        if (entityType === 'dashboard-campaign-info') {
          const findResult = await this.dashboardCampaignInfoRepository.findOne(
            {
              where: { campaignId },
            }
          );
          if (findResult.isErr()) return Err(findResult.unwrapErr());
          const entity = findResult.unwrap();
          if (entity && entity.id && entity.status === ApprovalStatus.PENDING) {
            entity.update({ status: newStatus });
            await this.dashboardCampaignInfoRepository.update(
              entity.id,
              entity
            );
            await this.recordApprovalHistory(
              entity.id,
              entityType,
              newStatus,
              adminId,
              comment
            );
            if (newStatus === ApprovalStatus.APPROVED) {
              await this.moveApprovedData(entity, entityType);
            }
          }
        } else if (entityType === 'dashboard-campaign-summary') {
          const findResult =
            await this.dashboardCampaignSummaryRepository.findOne({
              where: { campaignId },
            });
          if (findResult.isErr()) return Err(findResult.unwrapErr());
          const entity = findResult.unwrap();
          if (entity && entity.id && entity.status === ApprovalStatus.PENDING) {
            entity.update({ status: newStatus });
            await this.dashboardCampaignSummaryRepository.update(
              entity.id,
              entity
            );
            await this.recordApprovalHistory(
              entity.id,
              entityType,
              newStatus,
              adminId,
              comment
            );
            if (newStatus === ApprovalStatus.APPROVED) {
              await this.moveApprovedData(entity, entityType);
            }
          }
        } else if (entityType === 'dashboard-socials') {
          const findResult = await this.dashboardSocialsRepository.findOne({
            where: { campaignId },
          });
          if (findResult.isErr()) return Err(findResult.unwrapErr());
          const entity = findResult.unwrap();
          if (entity && entity.id && entity.status === ApprovalStatus.PENDING) {
            entity.update({ status: newStatus });
            await this.dashboardSocialsRepository.update(entity.id, entity);
            await this.recordApprovalHistory(
              entity.id,
              entityType,
              newStatus,
              adminId,
              comment
            );
            if (newStatus === ApprovalStatus.APPROVED) {
              await this.moveApprovedData(entity, entityType);
            }
          }
        } else if (entityType === 'dashboard-owners') {
          const findResult = await this.dashboardOwnersRepository.findMany({
            where: { campaignId },
          });
          if (findResult.isErr()) return Err(findResult.unwrapErr());
          const entities = findResult.unwrap();
          for (const entity of entities) {
            if (
              entity &&
              entity.id &&
              entity.status === ApprovalStatus.PENDING
            ) {
              entity.update({ status: newStatus });
              await this.dashboardOwnersRepository.update(entity.id, entity);
              await this.recordApprovalHistory(
                entity.id,
                entityType,
                newStatus,
                adminId,
                comment
              );
              if (newStatus === ApprovalStatus.APPROVED) {
                await this.moveApprovedData(entity, entityType);
              }
            }
          }
        } else {
          return Err(new Error(`Invalid entity type: ${entityType}`));
        }
      }

      return Ok({ success: true });
    } catch (error) {
      this.logger.error('Error reviewing dashboard submission', error as Error);
      return Err(
        new Error(
          `Failed to review dashboard submission: ${(error as Error).message}`
        )
      );
    }
  }

  private async recordApprovalHistory(
    entityId: string,
    entityType: string,
    status: ApprovalStatus,
    userId: string,
    comment?: string
  ): Promise<void> {
    const approvalHistory = ApprovalHistory.create({
      entityId,
      entityType,
      status,
      userId,
      comment: comment || null,
    });
    await this.approvalHistoryRepository.save(approvalHistory);
  }

  private async moveApprovedData(
    entity:
      | DashboardCampaignInfo
      | DashboardCampaignSummary
      | DashboardSocials
      | DashboardOwners,
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
          where: { campaignId: entity.campaignId } as unknown as Record<
            string,
            unknown
          >,
        });

        if (existingCampaignInfo.isOk() && existingCampaignInfo.unwrap()) {
          await this.campaignInfoRepository.update(
            existingCampaignInfo.unwrap()!.id as string,
            CampaignInfo.fromPersistence(campaignInfoData as CampaignInfoProps)
          );
        } else {
          await this.campaignInfoRepository.save(
            CampaignInfo.create(
              campaignInfoData as Omit<
                CampaignInfoProps,
                'createdAt' | 'updatedAt'
              >
            )
          );
        }
      } else if (
        entityType === 'dashboard-campaign-summary' &&
        entity instanceof DashboardCampaignSummary
      ) {
        const campaign =
          await this.dashboardCampaignSummaryRepository.mapper.toCampaign(
            entity
          );
        if (campaign) {
          await this.campaignRepository.update(entity.campaignId, campaign);
        }
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
            const issuer = await this.issuerRepository.findById(issuerId);
            if (issuer.isOk() && issuer.unwrap()) {
              const existingIssuer = issuer.unwrap();
              if (existingIssuer) {
                existingIssuer.update(issuerData);
                await this.issuerRepository.update(issuerId, existingIssuer);
              }
            }
          }
        }
      } else if (
        entityType === 'dashboard-owners' &&
        entity instanceof DashboardOwners
      ) {
        const ownerData =
          this.dashboardOwnersRepository.mapper.toOwnerPersistence(entity);
        await this.ownerRepository.save(Owner.create(ownerData).unwrap());
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
