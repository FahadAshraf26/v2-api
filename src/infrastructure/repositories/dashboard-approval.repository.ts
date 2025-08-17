import { randomUUID } from 'crypto';
import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/dependency-injection';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';

import {
  ApprovalStatusType,
  DashboardApprovalModelAttributes,
  DashboardApprovalProps,
  SubmittedItems,
} from '@/types/approval';

@injectable()
export class DashboardApprovalRepository {
  constructor(
    @inject(TOKENS.ORMAdapterToken) private readonly ormAdapter: IORMAdapter,
    @inject(LoggerService) private readonly logger: LoggerService
  ) {}

  /**
   * Create query builder for dashboard approvals
   */
  private createQueryBuilder() {
    return this.ormAdapter.createQueryBuilder<DashboardApprovalModelAttributes>(
      'DashboardApprovals'
    );
  }

  /**
   * Convert from persistence to domain - FIX OPTIONAL PROPERTIES
   */
  private toDomain(
    model: DashboardApprovalModelAttributes
  ): DashboardApprovalProps {
    return {
      id: model.id,
      campaignId: model.campaignId,
      submittedItems: model.submittedItems,
      status: model.status,
      submittedAt: model.submittedAt ?? undefined, // FIX: Use nullish coalescing
      reviewedAt: model.reviewedAt ?? undefined, // FIX: Use nullish coalescing
      submittedBy: model.submittedBy ?? undefined, // FIX: Use nullish coalescing
      reviewedBy: model.reviewedBy ?? undefined, // FIX: Use nullish coalescing
      comment: model.comment ?? undefined, // FIX: Use nullish coalescing
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  /**
   * Convert from domain to persistence
   */
  private toPersistence(
    domain: DashboardApprovalProps
  ): DashboardApprovalModelAttributes {
    return {
      id: domain.id,
      campaignId: domain.campaignId,
      submittedItems: domain.submittedItems,
      status: domain.status,
      submittedAt: domain.submittedAt ?? null,
      reviewedAt: domain.reviewedAt ?? null,
      submittedBy: domain.submittedBy ?? null,
      reviewedBy: domain.reviewedBy ?? null,
      comment: domain.comment ?? null,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  /**
   * Submit dashboard items for approval
   */
  async submitForApproval(
    campaignId: string,
    submittedItems: SubmittedItems,
    submittedBy: string
  ): Promise<Result<DashboardApprovalProps, Error>> {
    try {
      this.logger.info('Submitting dashboard items for approval', {
        campaignId,
        submittedItems,
        submittedBy,
      });

      // Check if approval already exists for this campaign
      const existingResult = await this.findByCampaignId(campaignId);
      if (existingResult.isErr()) {
        return Err(existingResult.unwrapErr());
      }

      const existing = existingResult.unwrap();

      if (existing) {
        // UPDATE: Campaign already has an approval record
        this.logger.info('Updating existing approval record', {
          campaignId,
          existingStatus: existing.status,
        });

        const updatedApproval: DashboardApprovalProps = {
          ...existing,
          submittedItems, // Update which items are submitted
          status: 'pending', // Reset to pending
          submittedAt: new Date(), // New submission time
          submittedBy, // Update submitter
          updatedAt: new Date(), // Update timestamp
          // Clear previous review data
          reviewedAt: undefined,
          reviewedBy: undefined,
          comment: undefined,
        };

        const updateResult = await this.ormAdapter.update(
          'DashboardApprovals',
          { campaignId },
          this.toPersistence(updatedApproval)
        );

        if (!updateResult) {
          return Err(new Error('Failed to update approval'));
        }

        return Ok(updatedApproval);
      } else {
        // CREATE: No approval record exists for this campaign
        this.logger.info('Creating new approval record', { campaignId });

        const newApproval: DashboardApprovalProps = {
          id: randomUUID(),
          campaignId,
          submittedItems,
          status: 'pending',
          submittedAt: new Date(),
          submittedBy,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const createResult = await this.ormAdapter.create(
          'DashboardApprovals',
          this.toPersistence(newApproval)
        );

        if (!createResult) {
          return Err(new Error('Failed to create approval'));
        }

        return Ok(newApproval);
      }
    } catch (error) {
      this.logger.error('Error submitting for approval', error as Error);
      return Err(
        new Error(`Failed to submit for approval: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Find approval by campaign ID - FIX NULL CHECK
   */
  async findByCampaignId(
    campaignId: string
  ): Promise<Result<DashboardApprovalProps | null, Error>> {
    try {
      this.logger.debug('Finding approval by campaign ID', { campaignId });

      const queryBuilder = this.createQueryBuilder();
      const results = await queryBuilder.where({ campaignId }).execute();

      if (results.length === 0 || !results[0]) {
        // FIX: Check for both empty array and undefined
        return Ok(null);
      }

      const domain = this.toDomain(results[0]);
      return Ok(domain);
    } catch (error) {
      this.logger.error(
        'Error finding approval by campaign ID',
        error as Error
      );
      return Err(
        new Error(`Failed to find approval: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Check if campaign has pending approval
   */
  async hasPendingApproval(
    campaignId: string
  ): Promise<Result<boolean, Error>> {
    try {
      this.logger.debug('Checking for pending approval', { campaignId });

      const approvalResult = await this.findByCampaignId(campaignId);
      if (approvalResult.isErr()) {
        return Err(approvalResult.unwrapErr());
      }

      const approval = approvalResult.unwrap();
      const hasPending = approval !== null && approval.status === 'pending';

      this.logger.debug('Pending approval check result', {
        campaignId,
        hasPending,
        currentStatus: approval?.status,
      });

      return Ok(hasPending);
    } catch (error) {
      this.logger.error('Error checking pending approval', error as Error);
      return Err(
        new Error(
          `Failed to check pending approval: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Find all pending approvals
   */
  async findPending(
    submittedBy?: string
  ): Promise<Result<DashboardApprovalProps[], Error>> {
    try {
      this.logger.debug('Finding pending approvals', { submittedBy });

      const queryBuilder = this.createQueryBuilder();
      const whereClause: any = { status: 'pending' };

      if (submittedBy) {
        whereClause.submittedBy = submittedBy;
      }

      const results = await queryBuilder
        .where(whereClause)
        .orderBy('submittedAt', 'ASC')
        .execute();

      const domains = results.map(result => this.toDomain(result));
      return Ok(domains);
    } catch (error) {
      this.logger.error('Error finding pending approvals', error as Error);
      return Err(
        new Error(
          `Failed to find pending approvals: ${(error as Error).message}`
        )
      );
    }
  }

  /**
   * Review approval (approve or reject)
   */
  async reviewApproval(
    campaignId: string,
    action: 'approve' | 'reject',
    reviewedBy: string,
    comment?: string
  ): Promise<Result<DashboardApprovalProps, Error>> {
    try {
      this.logger.info('Reviewing approval', {
        campaignId,
        action,
        reviewedBy,
      });

      // Find existing approval
      const existingResult = await this.findByCampaignId(campaignId);
      if (existingResult.isErr()) {
        return Err(existingResult.unwrapErr());
      }

      const existing = existingResult.unwrap();
      if (!existing) {
        return Err(new Error('Approval not found'));
      }

      if (existing.status !== 'pending') {
        return Err(new Error('Can only review pending approvals'));
      }

      // Update approval status
      const updatedApproval: DashboardApprovalProps = {
        ...existing,
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedAt: new Date(),
        reviewedBy,
        updatedAt: new Date(),
      };

      // Only add comment if provided
      if (comment) {
        updatedApproval.comment = comment;
      }

      const updateResult = await this.ormAdapter.update(
        'DashboardApprovals',
        { campaignId },
        this.toPersistence(updatedApproval)
      );

      if (!updateResult) {
        return Err(new Error('Failed to update approval'));
      }

      return Ok(updatedApproval);
    } catch (error) {
      this.logger.error('Error reviewing approval', error as Error);
      return Err(
        new Error(`Failed to review approval: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Get approval statistics
   */
  async getStatistics(): Promise<
    Result<
      {
        pending: number;
        approved: number;
        rejected: number;
      },
      Error
    >
  > {
    try {
      this.logger.debug('Getting approval statistics');

      const queryBuilder = this.createQueryBuilder();
      const results = await queryBuilder.execute();

      const stats = {
        pending: 0,
        approved: 0,
        rejected: 0,
      };

      results.forEach(result => {
        const domain = this.toDomain(result);
        stats[domain.status]++;
      });

      return Ok(stats);
    } catch (error) {
      this.logger.error('Error getting approval statistics', error as Error);
      return Err(
        new Error(`Failed to get statistics: ${(error as Error).message}`)
      );
    }
  }
}
