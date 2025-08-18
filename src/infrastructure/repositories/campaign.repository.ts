import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { Campaign } from '@/domain/campaign/entity/campaign.entity';
import { PaginatedResult } from '@/domain/core/repository.interface';

import { CampaignModelAttributes } from '@/infrastructure/database/models/campaign.model';
import { EventBus } from '@/infrastructure/events/event-bus';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { CampaignMapper } from '@/infrastructure/mappers/campaign.mapper';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import {
  GetPendingCampaignsDto,
  PendingCampaignDto,
} from '@/types/campaign/get-pending-campaigns.dto';

import { BaseRepository } from './base.repository';

@injectable()
export class CampaignRepository extends BaseRepository<
  Campaign,
  CampaignModelAttributes
> {
  constructor(
    @inject(TOKENS.ORMAdapterToken) ormAdapter: IORMAdapter,
    @inject(LoggerService) logger: LoggerService,
    @inject(EventBus) eventBus: EventBus,
    @inject(TOKENS.CampaignMapperToken) private readonly mapper: CampaignMapper
  ) {
    super('Campaign', ormAdapter, logger, eventBus);
  }

  protected getEntityName(): string {
    return 'Campaign';
  }

  protected override toDomain(model: CampaignModelAttributes): Campaign {
    return this.mapper.toDomain(model);
  }

  protected override toPersistence(domain: Campaign): any {
    return this.mapper.toPersistence(domain);
  }

  protected override mapDomainCriteriaToPersistence(
    criteria: any
  ): Record<string, any> {
    return this.mapper.toPersistenceCriteria(criteria);
  }

  protected override mapDomainUpdatesToPersistence(
    updates: Partial<Campaign>
  ): Record<string, any> {
    if (updates instanceof Campaign) {
      return this.mapper.toPersistenceUpdate(updates);
    }
    return super.mapDomainUpdatesToPersistence(updates);
  }

  // Custom campaign-specific methods

  /**
   * Find campaign by slug
   */
  async findBySlug(slug: string): Promise<Result<Campaign | null, Error>> {
    try {
      this.logger.debug('Finding campaign by slug', { slug });

      const queryBuilder =
        this.ormAdapter.createQueryBuilder<CampaignModelAttributes>('Campaign');
      const models = await queryBuilder.where({ slug }).execute();

      if (models.length === 0 || !models[0]) {
        return Ok(null);
      }

      const campaign = this.toDomain(models[0]);
      return Ok(campaign);
    } catch (error) {
      this.logger.error('Error finding campaign by slug', error as Error);
      return Err(
        new Error(
          `Failed to find campaign by slug: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Find campaigns by stage
   */
  async findByStage(stage: string): Promise<Result<Campaign[], Error>> {
    try {
      this.logger.debug('Finding campaigns by stage', { stage });

      const queryBuilder =
        this.ormAdapter.createQueryBuilder<CampaignModelAttributes>('Campaign');
      const models = await queryBuilder
        .where({ campaignStage: stage })
        .execute();

      const campaigns = models.map((model: CampaignModelAttributes) =>
        this.toDomain(model)
      );
      return Ok(campaigns);
    } catch (error) {
      this.logger.error('Error finding campaigns by stage', error as Error);
      return Err(
        new Error(
          `Failed to find campaigns by stage: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Find campaigns by investment type
   */
  async findByInvestmentType(
    investmentType: string
  ): Promise<Result<Campaign[], Error>> {
    try {
      this.logger.debug('Finding campaigns by investment type', {
        investmentType,
      });

      const queryBuilder =
        this.ormAdapter.createQueryBuilder<CampaignModelAttributes>('Campaign');
      const models = await queryBuilder.where({ investmentType }).execute();

      const campaigns = models.map((model: CampaignModelAttributes) =>
        this.toDomain(model)
      );
      return Ok(campaigns);
    } catch (error) {
      this.logger.error(
        'Error finding campaigns by investment type',
        error as Error
      );
      return Err(
        new Error(
          `Failed to find campaigns by investment type: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Find live campaigns (for explore page)
   */
  async findLiveCampaigns(): Promise<Result<Campaign[], Error>> {
    try {
      this.logger.debug('Finding live campaigns');

      const queryBuilder =
        this.ormAdapter.createQueryBuilder<CampaignModelAttributes>('Campaign');
      const models = await queryBuilder
        .where({
          campaignStage: 'live',
          isShowOnExplorePage: true,
        })
        .execute();

      const campaigns = models.map((model: CampaignModelAttributes) =>
        this.toDomain(model)
      );
      return Ok(campaigns);
    } catch (error) {
      this.logger.error('Error finding live campaigns', error as Error);
      return Err(
        new Error(`Failed to find live campaigns: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Find campaigns with target amount range
   */
  async findByTargetAmountRange(
    minAmount: number,
    maxAmount: number
  ): Promise<Result<Campaign[], Error>> {
    try {
      this.logger.debug('Finding campaigns by target amount range', {
        minAmount,
        maxAmount,
      });

      const queryBuilder =
        this.ormAdapter.createQueryBuilder<CampaignModelAttributes>('Campaign');
      const models = await queryBuilder
        .where({ isShowOnExplorePage: true })
        .execute();

      // Filter in memory for now (could be optimized with proper query builder support)
      const filteredModels = models.filter(
        (model: CampaignModelAttributes) =>
          model.campaignTargetAmount >= minAmount &&
          model.campaignTargetAmount <= maxAmount
      );

      const campaigns = filteredModels.map((model: CampaignModelAttributes) =>
        this.toDomain(model)
      );
      return Ok(campaigns);
    } catch (error) {
      this.logger.error(
        'Error finding campaigns by target amount range',
        error as Error
      );
      return Err(
        new Error(
          `Failed to find campaigns by target amount range: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Search campaigns by name or summary
   */
  async searchCampaigns(
    searchTerm: string
  ): Promise<Result<Campaign[], Error>> {
    try {
      this.logger.debug('Searching campaigns', { searchTerm });

      const queryBuilder =
        this.ormAdapter.createQueryBuilder<CampaignModelAttributes>('Campaign');
      const models = await queryBuilder
        .where({ isShowOnExplorePage: true })
        .execute();

      // Filter in memory for now (could be optimized with proper query builder support)
      const searchLower = searchTerm.toLowerCase();
      const filteredModels = models.filter(
        (model: CampaignModelAttributes) =>
          model.campaignName.toLowerCase().includes(searchLower) ||
          (model.summary && model.summary.toLowerCase().includes(searchLower))
      );

      const campaigns = filteredModels.map((model: CampaignModelAttributes) =>
        this.toDomain(model)
      );
      return Ok(campaigns);
    } catch (error) {
      this.logger.error('Error searching campaigns', error as Error);
      return Err(
        new Error(`Failed to search campaigns: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Find campaigns with their dashboard info (using association)
   */
  async findWithDashboardInfo(
    campaignId: string
  ): Promise<Result<Campaign | null, Error>> {
    try {
      this.logger.debug('Finding campaign with dashboard info', { campaignId });

      const queryBuilder =
        this.ormAdapter.createQueryBuilder<CampaignModelAttributes>('Campaign');
      const models = await queryBuilder
        .where({ campaignId })
        .include('dashboardInfo')
        .execute();

      if (models.length === 0 || !models[0]) {
        return Ok(null);
      }

      const campaign = this.toDomain(models[0]);
      return Ok(campaign);
    } catch (error) {
      this.logger.error(
        'Error finding campaign with dashboard info',
        error as Error
      );
      return Err(
        new Error(
          `Failed to find campaign with dashboard info: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Update campaign stage
   */
  async updateStage(
    campaignId: string,
    newStage: string
  ): Promise<Result<Campaign, Error>> {
    try {
      this.logger.info('Updating campaign stage', { campaignId, newStage });

      // Use the ORM adapter directly to find by primary key
      const model = await this.ormAdapter.findByPk<CampaignModelAttributes>(
        'Campaign',
        campaignId
      );
      if (!model) {
        return Err(new Error('Campaign not found'));
      }

      const campaign = this.toDomain(model);

      // Update the campaign stage through domain logic
      const updateResult = campaign.update({ campaignStage: newStage });
      if (updateResult.isErr()) {
        return Err(updateResult.unwrapErr());
      }

      // Save using ORM adapter directly
      await this.ormAdapter.update(
        'Campaign',
        { campaignStage: newStage, updatedAt: new Date() },
        { campaignId }
      );

      this.logger.info('Campaign stage updated successfully', {
        campaignId,
        newStage,
      });
      return Ok(campaign);
    } catch (error) {
      this.logger.error('Error updating campaign stage', error as Error);
      return Err(
        new Error(
          `Failed to update campaign stage: ${(error as Error).message}`
        )
      );
    }
  }

  async findPendingWithFilters(
    dto: GetPendingCampaignsDto
  ): Promise<Result<PaginatedResult<PendingCampaignDto>, Error>> {
    try {
      const page = dto.page || 1;
      const perPage = dto.perPage || 10;
      const offset = (page - 1) * perPage;

      const replacements: any = {
        status: ApprovalStatus.PENDING,
        limit: perPage,
        offset,
      };

      let whereClause = '';
      if (dto.campaignStage) {
        whereClause += ' AND c.`campaignStage` = :campaignStage';
        replacements.campaignStage = dto.campaignStage;
      }
      if (dto.searchTerm) {
        whereClause += ' AND c.`campaignName` LIKE :searchTerm';
        replacements.searchTerm = `%${dto.searchTerm}%`;
      }

      const dataQuery = `
        WITH AllDashboardItems AS (
          SELECT \`campaignId\`, \`id\`, 'dashboard-campaign-info' as \`entityType\`, \`status\` FROM \`dashboardCampaignInfo\`
          UNION ALL
          SELECT \`campaignId\`, \`id\`, 'dashboard-campaign-summary' as \`entityType\`, \`status\` FROM \`dashboardCampaignSummary\`
          UNION ALL
          SELECT \`campaignId\`, \`id\`, 'dashboard-socials' as \`entityType\`, \`status\` FROM \`dashboardSocials\`
        ),
        PendingDashboardItems AS (
          SELECT * FROM AllDashboardItems WHERE \`status\` = :status
        ),
        LatestApprovalHistory AS (
          SELECT
              pdi.\`campaignId\`,
              ah.\`userId\` as \`submittedBy\`,
              ah.\`createdAt\` as \`submittedAt\`,
              ROW_NUMBER() OVER(PARTITION BY pdi.\`campaignId\` ORDER BY ah.\`createdAt\` DESC) as rn
          FROM PendingDashboardItems pdi
          JOIN \`approvalHistory\` ah ON pdi.\`id\` = ah.\`entityId\` AND pdi.\`entityType\` = ah.\`entityType\`
          WHERE ah.status = :status
        )
        SELECT
            c.\`campaignName\`,
            c.\`campaignStage\`,
            lah.\`submittedBy\`,
            lah.\`submittedAt\`,
            :status as status
        FROM \`campaigns\` c
        JOIN LatestApprovalHistory lah ON c.\`campaignId\` = lah.\`campaignId\` AND lah.rn = 1
        WHERE 1=1 ${whereClause}
        ORDER BY lah.\`submittedAt\` DESC
        LIMIT :limit OFFSET :offset
      `;

      const countQuery = `
        WITH AllDashboardItems AS (
            SELECT \`campaignId\`, \`status\` FROM \`dashboardCampaignInfo\`
            UNION ALL
            SELECT \`campaignId\`, \`status\` FROM \`dashboardCampaignSummary\`
            UNION ALL
            SELECT \`campaignId\`, \`status\` FROM \`dashboardSocials\`
        ),
        PendingCampaigns AS (
            SELECT DISTINCT \`campaignId\` FROM AllDashboardItems WHERE \`status\` = :status
        )
        SELECT COUNT(c.\`campaignId\`) as count
        FROM \`campaigns\` c
        JOIN PendingCampaigns pc ON c.\`campaignId\` = pc.\`campaignId\`
        WHERE 1=1 ${whereClause}
      `;

      const [results, countResult] = await Promise.all([
        this.ormAdapter.rawQuery(dataQuery, replacements),
        this.ormAdapter.rawQuery(countQuery, replacements),
      ]);

      const total = countResult[0]?.count || 0;

      const paginatedResult = {
        items: results as PendingCampaignDto[],
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
        hasNext: page * perPage < total,
        hasPrevious: page > 1,
      };

      return Ok(paginatedResult);
    } catch (error) {
      this.logger.error('Error finding pending campaigns with filters', error);
      return Err(new Error('Failed to fetch pending campaigns'));
    }
  }
}
