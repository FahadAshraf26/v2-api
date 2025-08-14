import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/dependency-injection';

import { DashboardCampaignSummary } from '@/domain/dashboard-campaign-summary/entity/dashboard-campaign-summary.entity';

import { EventBus } from '@/infrastructure/events/event-bus';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { DashboardCampaignSummaryMapper } from '@/infrastructure/mappers/dashboard-campaign-summary.mapper';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';

import {
  DashboardCampaignSummaryModelAttributes,
  DashboardCampaignSummaryWithApproval,
} from '@/types/dashboard-campaign-summary';

import { BaseRepository } from './base.repository';
import { DashboardApprovalRepository } from './dashboard-approval.repository';

@injectable()
export class DashboardCampaignSummaryRepository extends BaseRepository<
  DashboardCampaignSummary,
  DashboardCampaignSummaryModelAttributes
> {
  constructor(
    @inject(TOKENS.ORMAdapterToken) ormAdapter: IORMAdapter,
    @inject(LoggerService) logger: LoggerService,
    @inject(EventBus) eventBus: EventBus,
    @inject(DashboardCampaignSummaryMapper)
    private readonly mapper: DashboardCampaignSummaryMapper,
    @inject(DashboardApprovalRepository)
    private readonly approvalRepository: DashboardApprovalRepository
  ) {
    super('DashboardCampaignSummary', ormAdapter, logger, eventBus);
  }

  protected getEntityName(): string {
    return 'DashboardCampaignSummary';
  }

  protected toDomain(
    model: DashboardCampaignSummaryModelAttributes
  ): DashboardCampaignSummary {
    return this.mapper.toDomainFromBusinessData(model);
  }

  protected toPersistence(
    domain: DashboardCampaignSummary
  ): DashboardCampaignSummaryModelAttributes {
    return this.mapper.toBusinessPersistence(domain);
  }

  protected toPersistenceCriteria(
    domainCriteria: Record<string, any>
  ): Record<string, any> {
    return this.mapper.toBusinessPersistenceCriteria(domainCriteria);
  }

  /**
   * Find dashboard campaign summary with approval data by ID
   */
  async findByIdWithApproval(
    id: string
  ): Promise<Result<DashboardCampaignSummary | null, Error>> {
    try {
      this.logger.debug(
        'Finding dashboard campaign summary with approval by ID',
        { id }
      );

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
        'dashboard-campaign-summary',
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
      const withApprovalData: DashboardCampaignSummaryWithApproval = {
        summary: this.mapper.toBusinessPersistence(business),
        ...(approval && { approval }),
      };

      const domain = this.mapper.toDomain(withApprovalData);
      return Ok(domain);
    } catch (error) {
      this.logger.error(
        'Error finding dashboard campaign summary with approval',
        error as Error
      );
      return Err(
        new Error(
          `Failed to find dashboard campaign summary: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Find by campaign ID with approval data
   */
  async findByCampaignIdWithApproval(
    campaignId: string
  ): Promise<Result<DashboardCampaignSummary | null, Error>> {
    try {
      this.logger.debug(
        'Finding dashboard campaign summary by campaign ID with approval',
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
        'dashboard-campaign-summary',
        business.id!
      );
      if (approvalResult.isErr()) {
        this.logger.warn(
          'Failed to fetch approval data',
          approvalResult.unwrapErr()
        );
      }

      // Combine data
      const approval = approvalResult.isOk() ? approvalResult.unwrap() : null;
      const withApprovalData: DashboardCampaignSummaryWithApproval = {
        summary: this.mapper.toBusinessPersistence(business),
        ...(approval && { approval }),
      };

      const domain = this.mapper.toDomain(withApprovalData);
      return Ok(domain);
    } catch (error) {
      this.logger.error(
        'Error finding dashboard campaign summary by campaign ID',
        error as Error
      );
      return Err(
        new Error(
          `Failed to find dashboard campaign summary: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Submit dashboard campaign summary for approval
   */
  async submitForApproval(
    id: string,
    submittedBy: string
  ): Promise<Result<DashboardCampaignSummary, Error>> {
    try {
      this.logger.info('Submitting dashboard campaign summary for approval', {
        id,
        submittedBy,
      });

      // Find the summary first
      const summaryResult = await this.findById(id);
      if (summaryResult.isErr()) {
        return Err(summaryResult.unwrapErr());
      }

      const summary = summaryResult.unwrap();
      if (!summary) {
        return Err(new Error('Dashboard campaign summary not found'));
      }

      // Submit for approval
      const approvalResult = await this.approvalRepository.submitForApproval(
        'dashboard-campaign-summary',
        id,
        summary.campaignId,
        submittedBy
      );

      if (approvalResult.isErr()) {
        return Err(approvalResult.unwrapErr());
      }

      // Return updated summary with approval data
      return (await this.findByIdWithApproval(id)) as Result<
        DashboardCampaignSummary,
        Error
      >;
    } catch (error) {
      this.logger.error(
        'Error submitting dashboard campaign summary for approval',
        error as Error
      );
      return Err(
        new Error(`Failed to submit for approval: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Find summaries by submitted user with approval data
   */
  async findBySubmittedByWithApproval(
    userId: string
  ): Promise<Result<DashboardCampaignSummary[], Error>> {
    try {
      this.logger.debug(
        'Finding dashboard campaign summaries by submitted user',
        { userId }
      );

      // Get approvals for this user
      const approvalsResult = await this.approvalRepository.findBySubmittedBy(
        userId,
        'dashboard-campaign-summary'
      );
      if (approvalsResult.isErr()) {
        return Err(approvalsResult.unwrapErr());
      }

      const approvals = approvalsResult.unwrap();
      const summaries: DashboardCampaignSummary[] = [];

      // Get business data for each approval
      for (const approval of approvals) {
        const businessResult = await this.findById(approval.entityId);
        if (businessResult.isOk() && businessResult.unwrap()) {
          const business = businessResult.unwrap()!;
          const withApprovalData: DashboardCampaignSummaryWithApproval = {
            summary: this.mapper.toBusinessPersistence(business),
            approval,
          };
          summaries.push(this.mapper.toDomain(withApprovalData));
        }
      }

      return Ok(summaries);
    } catch (error) {
      this.logger.error(
        'Error finding summaries by submitted user',
        error as Error
      );
      return Err(
        new Error(`Failed to find summaries: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Find approved dashboard campaign summaries
   */
  async findApprovedWithApproval(): Promise<
    Result<DashboardCampaignSummary[], Error>
  > {
    try {
      this.logger.debug('Finding approved dashboard campaign summaries');

      // Get approved approvals
      const approvalsResult = await this.approvalRepository.findPending(
        'dashboard-campaign-summary'
      );
      if (approvalsResult.isErr()) {
        return Err(approvalsResult.unwrapErr());
      }

      // Filter for approved ones
      const approvals = approvalsResult
        .unwrap()
        .filter(a => a.status === 'approved');
      const summaries: DashboardCampaignSummary[] = [];

      // Get business data for each approval
      for (const approval of approvals) {
        const businessResult = await this.findById(approval.entityId);
        if (businessResult.isOk() && businessResult.unwrap()) {
          const business = businessResult.unwrap()!;
          const withApprovalData: DashboardCampaignSummaryWithApproval = {
            summary: this.mapper.toBusinessPersistence(business),
            approval,
          };
          summaries.push(this.mapper.toDomain(withApprovalData));
        }
      }

      return Ok(summaries);
    } catch (error) {
      this.logger.error(
        'Error finding approved dashboard campaign summaries',
        error as Error
      );
      return Err(
        new Error(`Failed to find approved items: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Count summaries by status using approval table
   */
  async countByStatusWithApproval(): Promise<
    Result<{ pending: number; approved: number; rejected: number }, Error>
  > {
    try {
      this.logger.debug('Counting dashboard campaign summaries by status');

      const statsResult = await this.approvalRepository.getStatistics();
      if (statsResult.isErr()) {
        return Err(statsResult.unwrapErr());
      }

      const stats = statsResult.unwrap();
      return Ok(stats.byEntityType['dashboard-campaign-summary']);
    } catch (error) {
      this.logger.error('Error counting summaries by status', error as Error);
      return Err(
        new Error(`Failed to count summaries: ${(error as Error).message}`)
      );
    }
  }
}
