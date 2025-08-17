import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/dependency-injection';

import { CampaignInfoModelAttributes } from '@/infrastructure/database/models/campaign-info.model';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';

@injectable()
export class CampaignInfoRepository {
  constructor(
    @inject(TOKENS.ORMAdapterToken) private readonly ormAdapter: IORMAdapter,
    @inject(LoggerService) private readonly logger: LoggerService
  ) {}

  /**
   * Find campaign info by campaign ID
   */
  async findByCampaignId(
    campaignId: string
  ): Promise<Result<CampaignInfoModelAttributes | null, Error>> {
    try {
      this.logger.debug('Finding campaign info by campaign ID', { campaignId });

      const queryBuilder =
        this.ormAdapter.createQueryBuilder<CampaignInfoModelAttributes>(
          'CampaignInfo'
        );
      const models = await queryBuilder.where({ campaignId }).execute();

      if (models.length === 0 || !models[0]) {
        return Ok(null);
      }

      return Ok(models[0]);
    } catch (error) {
      this.logger.error(
        'Error finding campaign info by campaign ID',
        error as Error
      );
      return Err(
        new Error(`Failed to find campaign info: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Find campaign info by ID
   */
  async findById(
    campaignInfoId: string
  ): Promise<Result<CampaignInfoModelAttributes | null, Error>> {
    try {
      this.logger.debug('Finding campaign info by ID', { campaignInfoId });

      const model = await this.ormAdapter.findByPk<CampaignInfoModelAttributes>(
        'CampaignInfo',
        campaignInfoId
      );

      if (!model) {
        return Ok(null);
      }

      return Ok(model);
    } catch (error) {
      this.logger.error('Error finding campaign info by ID', error as Error);
      return Err(
        new Error(`Failed to find campaign info: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Create new campaign info
   */
  async createCampaignInfo(
    data: Omit<
      CampaignInfoModelAttributes,
      'createdAt' | 'updatedAt' | 'deletedAt'
    >
  ): Promise<Result<CampaignInfoModelAttributes, Error>> {
    try {
      this.logger.info('Creating campaign info', {
        campaignId: data.campaignId,
      });

      const now = new Date();
      const campaignInfo: CampaignInfoModelAttributes = {
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      await this.ormAdapter.create('CampaignInfo', campaignInfo);

      this.logger.info('Campaign info created successfully', {
        campaignInfoId: data.campaignInfoId,
        campaignId: data.campaignId,
      });

      return Ok(campaignInfo);
    } catch (error) {
      this.logger.error('Error creating campaign info', error as Error);
      return Err(
        new Error(`Failed to create campaign info: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Update campaign info
   */
  async updateCampaignInfo(
    campaignInfoId: string,
    updates: Partial<
      Omit<
        CampaignInfoModelAttributes,
        'campaignInfoId' | 'createdAt' | 'updatedAt' | 'deletedAt'
      >
    >
  ): Promise<Result<CampaignInfoModelAttributes, Error>> {
    try {
      this.logger.info('Updating campaign info', { campaignInfoId });

      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await this.ormAdapter.update('CampaignInfo', updateData, {
        campaignInfoId,
      });

      // Fetch the updated record
      const updatedResult = await this.findById(campaignInfoId);
      if (updatedResult.isErr()) {
        return Err(updatedResult.unwrapErr());
      }

      const updated = updatedResult.unwrap();
      if (!updated) {
        return Err(new Error('Campaign info not found after update'));
      }

      this.logger.info('Campaign info updated successfully', {
        campaignInfoId,
      });
      return Ok(updated);
    } catch (error) {
      this.logger.error('Error updating campaign info', error as Error);
      return Err(
        new Error(`Failed to update campaign info: ${(error as Error).message}`)
      );
    }
  }
}
