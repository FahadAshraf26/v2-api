import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/dependency-injection';

import { DashboardCampaignInfo } from '@/domain/dashboard-campaign-info/entity/dashboard-campaign-info.entity';

import { EventBus } from '@/infrastructure/events/event-bus';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { DashboardCampaignInfoMapper } from '@/infrastructure/mappers/dashboard-campaign-info.mapper';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';

import {
  DashboardCampaignInfoModelAttributes,
  DashboardCampaignInfoWithApproval,
} from '@/types/dashboard-campaign-info';

import { BaseRepository } from './base.repository';
import { DashboardApprovalRepository } from './dashboard-approval.repository';

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
    private readonly mapper: DashboardCampaignInfoMapper,
    @inject(DashboardApprovalRepository)
    private readonly approvalRepository: DashboardApprovalRepository
  ) {
    super('DashboardCampaignInfo', ormAdapter, logger, eventBus);
  }

  protected getEntityName(): string {
    return 'DashboardCampaignInfo';
  }

  protected toDomain(
    model: DashboardCampaignInfoModelAttributes
  ): DashboardCampaignInfo {
    return this.mapper.toDomainFromBusinessData(model);
  }

  protected toPersistence(
    domain: DashboardCampaignInfo
  ): DashboardCampaignInfoModelAttributes {
    return this.mapper.toBusinessPersistence(domain);
  }

  protected toPersistenceCriteria(
    domainCriteria: Record<string, any>
  ): Record<string, any> {
    return this.mapper.toBusinessPersistenceCriteria(domainCriteria);
  }

  protected override mapDomainUpdatesToPersistence(
    updates: Partial<DashboardCampaignInfo>
  ): Record<string, any> {
    if (updates instanceof DashboardCampaignInfo) {
      return this.mapper.toBusinessPersistenceUpdate(updates);
    }
    return super.mapDomainUpdatesToPersistence(updates);
  }

  /**
   * Find dashboard campaign info by campaign ID (legacy method for business data only)
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

      const domain = this.mapper.toDomainFromBusinessData(result);
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
   * Find dashboard campaign info with approval data by ID
   */
  async findByIdWithApproval(
    id: string
  ): Promise<Result<DashboardCampaignInfo | null, Error>> {
    try {
      this.logger.debug('Finding dashboard campaign info with approval by ID', {
        id,
      });

      // Get business data
      const businessResult = await this.findById(id);
      if (businessResult.isErr()) {
        return Err(businessResult.unwrapErr());
      }

      const business = businessResult.unwrap();
      if (!business) {
        return Ok(null);
      }

      // Get approval data
      const approvalResult = await this.approvalRepository.findByEntity(
        'dashboard-campaign-info',
        id
      );
      if (approvalResult.isErr()) {
        this.logger.warn(
          'Failed to fetch approval data',
          approvalResult.unwrapErr()
        );
      }

      // Combine data
      const approval = approvalResult.isOk() ? approvalResult.unwrap() : null;
      const withApprovalData: DashboardCampaignInfoWithApproval = {
        info: this.mapper.toBusinessPersistence(business),
        ...(approval && { approval }),
      };

      const domain = this.mapper.toDomain(withApprovalData);
      return Ok(domain);
    } catch (error) {
      this.logger.error(
        'Error finding dashboard campaign info with approval',
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
   * Find by campaign ID with approval data
   */
  async findByCampaignIdWithApproval(
    campaignId: string
  ): Promise<Result<DashboardCampaignInfo | null, Error>> {
    try {
      this.logger.debug(
        'Finding dashboard campaign info by campaign ID with approval',
        { campaignId }
      );

      const queryBuilder = this.createQueryBuilder();
      const results = await queryBuilder.where({ campaignId }).execute();

      if (results.length === 0) {
        return Ok(null);
      }

      const business = this.toDomain(results[0]!);

      // Get approval data
      const approvalResult = await this.approvalRepository.findByEntity(
        'dashboard-campaign-info',
        business.id
      );
      if (approvalResult.isErr()) {
        this.logger.warn(
          'Failed to fetch approval data',
          approvalResult.unwrapErr()
        );
      }

      // Combine data
      const approval = approvalResult.isOk() ? approvalResult.unwrap() : null;
      const withApprovalData: DashboardCampaignInfoWithApproval = {
        info: this.mapper.toBusinessPersistence(business),
        ...(approval && { approval }),
      };

      const domain = this.mapper.toDomain(withApprovalData);
      return Ok(domain);
    } catch (error) {
      this.logger.error(
        'Error finding dashboard campaign info by campaign ID',
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
   * Submit dashboard campaign info for approval
   */
  async submitForApproval(
    id: string,
    submittedBy: string
  ): Promise<Result<DashboardCampaignInfo, Error>> {
    try {
      this.logger.info('Submitting dashboard campaign info for approval', {
        id,
        submittedBy,
      });

      // Find the info first
      const infoResult = await this.findById(id);
      if (infoResult.isErr()) {
        return Err(infoResult.unwrapErr());
      }

      const info = infoResult.unwrap();
      if (!info) {
        return Err(new Error('Dashboard campaign info not found'));
      }

      // Submit for approval
      const approvalResult = await this.approvalRepository.submitForApproval(
        'dashboard-campaign-info',
        id,
        info.campaignId,
        submittedBy
      );

      if (approvalResult.isErr()) {
        return Err(approvalResult.unwrapErr());
      }

      // Return updated info with approval data
      return (await this.findByIdWithApproval(id)) as Result<
        DashboardCampaignInfo,
        Error
      >;
    } catch (error) {
      this.logger.error(
        'Error submitting dashboard campaign info for approval',
        error as Error
      );
      return Err(
        new Error(`Failed to submit for approval: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Find infos by submitted user with approval data
   */
  async findBySubmittedByWithApproval(
    userId: string
  ): Promise<Result<DashboardCampaignInfo[], Error>> {
    try {
      this.logger.debug('Finding dashboard campaign infos by submitted user', {
        userId,
      });

      // Get approvals for this user
      const approvalsResult = await this.approvalRepository.findBySubmittedBy(
        userId,
        'dashboard-campaign-info'
      );
      if (approvalsResult.isErr()) {
        return Err(approvalsResult.unwrapErr());
      }

      const approvals = approvalsResult.unwrap();
      const infos: DashboardCampaignInfo[] = [];

      // Get business data for each approval
      for (const approval of approvals) {
        const businessResult = await this.findById(approval.entityId);
        if (businessResult.isOk() && businessResult.unwrap()) {
          const business = businessResult.unwrap()!;
          const withApprovalData: DashboardCampaignInfoWithApproval = {
            info: this.mapper.toBusinessPersistence(business),
            approval,
          };
          infos.push(this.mapper.toDomain(withApprovalData));
        }
      }

      return Ok(infos);
    } catch (error) {
      this.logger.error(
        'Error finding infos by submitted user',
        error as Error
      );
      return Err(
        new Error(`Failed to find infos: ${(error as Error).message}`)
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
