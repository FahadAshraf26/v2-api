import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/dependency-injection';

import { DashboardSocials } from '@/domain/dashboard-socials/entity/dashboard-socials.entity';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { DashboardSocialsMapper } from '@/infrastructure/mappers/dashboard-socials.mapper';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';
import { DashboardApprovalRepository } from '@/infrastructure/repositories/dashboard-approval.repository';

import { ApprovalStatus } from '@/shared/enums/approval-status.enums';

import {
  DashboardSocialsModelAttributes,
  DashboardSocialsWithApproval,
} from '@/types/dashboard-socials';

@injectable()
export class DashboardSocialsRepository {
  constructor(
    @inject(TOKENS.ORMAdapterToken) private readonly ormAdapter: IORMAdapter,
    @inject(LoggerService) private readonly logger: LoggerService,
    @inject(TOKENS.DashboardSocialsMapperToken)
    private readonly mapper: DashboardSocialsMapper,
    @inject(DashboardApprovalRepository)
    private readonly approvalRepository: DashboardApprovalRepository
  ) {}

  /**
   * Save dashboard socials entity
   */
  async save(
    socials: DashboardSocials
  ): Promise<Result<DashboardSocials, Error>> {
    try {
      this.logger.debug('Saving dashboard socials', { id: socials.id });

      const persistenceData = this.mapper.toPersistence(socials);
      await this.ormAdapter.create('DashboardSocials', persistenceData);

      this.logger.debug('Dashboard socials saved successfully', {
        id: socials.id,
      });
      return Ok(socials);
    } catch (error) {
      this.logger.error('Error saving dashboard socials', error as Error);
      return Err(
        new Error(
          `Failed to save dashboard socials: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Update dashboard socials entity
   */
  async update(
    id: string,
    socials: DashboardSocials
  ): Promise<Result<DashboardSocials, Error>> {
    try {
      this.logger.debug('Updating dashboard socials', { id });

      const persistenceData = this.mapper.toPersistence(socials);
      await this.ormAdapter.update('DashboardSocials', persistenceData, { id });

      this.logger.debug('Dashboard socials updated successfully', { id });
      return Ok(socials);
    } catch (error) {
      this.logger.error('Error updating dashboard socials', error as Error);
      return Err(
        new Error(
          `Failed to update dashboard socials: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Find dashboard socials by ID with approval data
   */
  async findByIdWithApproval(
    id: string
  ): Promise<Result<DashboardSocials | null, Error>> {
    try {
      this.logger.debug('Finding dashboard socials by ID with approval', {
        id,
      });

      const queryBuilder =
        this.ormAdapter.createQueryBuilder<DashboardSocialsModelAttributes>(
          'DashboardSocials'
        );
      const models = await queryBuilder
        .where({ id })
        .include('approval')
        .execute();

      if (models.length === 0 || !models[0]) {
        return Ok(null);
      }

      const withApproval: DashboardSocialsWithApproval = {
        socials: models[0],
        approval: (models[0] as any).approval,
      };

      const socials = this.mapper.toDomain(withApproval);
      return Ok(socials);
    } catch (error) {
      this.logger.error(
        'Error finding dashboard socials by ID',
        error as Error
      );
      return Err(
        new Error(
          `Failed to find dashboard socials: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Find dashboard socials by campaign ID with approval data
   */
  async findByCampaignIdWithApproval(
    campaignId: string
  ): Promise<Result<DashboardSocials | null, Error>> {
    try {
      this.logger.debug(
        'Finding dashboard socials by campaign ID with approval',
        { campaignId }
      );

      const queryBuilder =
        this.ormAdapter.createQueryBuilder<DashboardSocialsModelAttributes>(
          'DashboardSocials'
        );
      const models = await queryBuilder
        .where({ campaignId })
        .include('approval')
        .execute();

      if (models.length === 0 || !models[0]) {
        return Ok(null);
      }

      const withApproval: DashboardSocialsWithApproval = {
        socials: models[0],
        approval: (models[0] as any).approval,
      };

      const socials = this.mapper.toDomain(withApproval);
      return Ok(socials);
    } catch (error) {
      this.logger.error(
        'Error finding dashboard socials by campaign ID',
        error as Error
      );
      return Err(
        new Error(
          `Failed to find dashboard socials: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Find dashboard socials by submitted user with approval data
   */
  async findBySubmittedByWithApproval(
    userId: string
  ): Promise<Result<DashboardSocials[], Error>> {
    try {
      this.logger.debug(
        'Finding dashboard socials by submitted user with approval',
        { userId }
      );

      // Get approvals for this user
      const approvalsResult = await this.approvalRepository.findBySubmittedBy(
        userId,
        'dashboard-socials'
      );

      if (approvalsResult.isErr()) {
        return Err(approvalsResult.unwrapErr());
      }

      const approvals = approvalsResult.unwrap();
      const socials: DashboardSocials[] = [];

      // Get business data for each approval
      for (const approval of approvals) {
        const socialsResult = await this.findByIdWithApproval(
          approval.entityId
        );
        if (socialsResult.isOk() && socialsResult.unwrap()) {
          socials.push(socialsResult.unwrap()!);
        }
      }

      return Ok(socials);
    } catch (error) {
      this.logger.error(
        'Error finding dashboard socials by submitted user',
        error as Error
      );
      return Err(
        new Error(
          `Failed to find dashboard socials: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Submit dashboard socials for approval
   */
  async submitForApproval(
    id: string,
    userId: string
  ): Promise<Result<DashboardSocials, Error>> {
    try {
      this.logger.debug('Submitting dashboard socials for approval', {
        id,
        userId,
      });

      // Find the entity first
      const findResult = await this.findByIdWithApproval(id);
      if (findResult.isErr()) {
        return Err(findResult.unwrapErr());
      }

      const socials = findResult.unwrap();
      if (!socials) {
        return Err(new Error('Dashboard socials not found'));
      }

      // Submit through domain logic
      const submitResult = socials.submit(userId);
      if (submitResult.isErr()) {
        return Err(submitResult.unwrapErr());
      }

      // Submit for approval using the approval repository
      const approvalResult = await this.approvalRepository.submitForApproval(
        'dashboard-socials',
        id,
        socials.campaignId,
        userId
      );

      if (approvalResult.isErr()) {
        return Err(approvalResult.unwrapErr());
      }

      // Return updated socials with approval data
      return (await this.findByIdWithApproval(id)) as Result<
        DashboardSocials,
        Error
      >;
    } catch (error) {
      this.logger.error(
        'Error submitting dashboard socials for approval',
        error as Error
      );
      return Err(
        new Error(
          `Failed to submit dashboard socials: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Count dashboard socials by status with approval data
   */
  async countByStatusWithApproval(): Promise<
    Result<{ pending: number; approved: number; rejected: number }, Error>
  > {
    try {
      this.logger.debug('Counting dashboard socials by status');

      const queryBuilder =
        this.ormAdapter.createQueryBuilder<DashboardSocialsModelAttributes>(
          'DashboardSocials'
        );
      const models = await queryBuilder.include('approval').execute();

      const counts = {
        pending: 0,
        approved: 0,
        rejected: 0,
      };

      models.forEach((model: any) => {
        if (model.approval) {
          switch (model.approval.status) {
            case ApprovalStatus.PENDING:
              counts.pending++;
              break;
            case ApprovalStatus.APPROVED:
              counts.approved++;
              break;
            case ApprovalStatus.REJECTED:
              counts.rejected++;
              break;
          }
        }
      });

      return Ok(counts);
    } catch (error) {
      this.logger.error(
        'Error counting dashboard socials by status',
        error as Error
      );
      return Err(
        new Error(
          `Failed to count dashboard socials: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Delete dashboard socials
   */
  async delete(id: string): Promise<Result<void, Error>> {
    try {
      this.logger.debug('Deleting dashboard socials', { id });

      await this.ormAdapter.delete('DashboardSocials', { id });

      this.logger.debug('Dashboard socials deleted successfully', { id });
      return Ok(undefined);
    } catch (error) {
      this.logger.error('Error deleting dashboard socials', error as Error);
      return Err(
        new Error(
          `Failed to delete dashboard socials: ${(error as Error).message}`
        )
      );
    }
  }
}
