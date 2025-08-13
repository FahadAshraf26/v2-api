import { injectable, inject } from 'tsyringe';
import { Result, Ok, Err } from 'oxide.ts';
import { randomUUID } from 'crypto';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';
import type { IQueryBuilder } from '@/infrastructure/persistence/query-builder/query-builder.interface';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { TOKENS } from '@/config/dependency-injection';
import {
  DashboardApprovalModelAttributes,
  DashboardApprovalProps,
  EntityType
} from '@/types/approval';

@injectable()
export class DashboardApprovalRepository {
  constructor(
    @inject(TOKENS.ORMAdapterToken) private readonly ormAdapter: IORMAdapter,
    @inject(LoggerService) private readonly logger: LoggerService
  ) {}

  private toDomain(model: DashboardApprovalModelAttributes): DashboardApprovalProps {
    const props: DashboardApprovalProps = {
      id: model.id,
      entityType: model.entityType,
      entityId: model.entityId,
      campaignId: model.campaignId,
      status: model.status,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };

    // Only add optional properties if they exist
    if (model.submittedAt) {
      props.submittedAt = model.submittedAt;
    }
    if (model.reviewedAt) {
      props.reviewedAt = model.reviewedAt;
    }
    if (model.submittedBy) {
      props.submittedBy = model.submittedBy;
    }
    if (model.reviewedBy) {
      props.reviewedBy = model.reviewedBy;
    }
    if (model.comment) {
      props.comment = model.comment;
    }

    return props;
  }

  private toPersistence(domain: DashboardApprovalProps): DashboardApprovalModelAttributes {
    return {
      id: domain.id,
      entityType: domain.entityType,
      entityId: domain.entityId,
      campaignId: domain.campaignId,
      status: domain.status,
      submittedAt: domain.submittedAt || null,
      reviewedAt: domain.reviewedAt || null,
      submittedBy: domain.submittedBy || null,
      reviewedBy: domain.reviewedBy || null,
      comment: domain.comment || null,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  private createQueryBuilder(): IQueryBuilder<DashboardApprovalModelAttributes> {
    return this.ormAdapter.createQueryBuilder<DashboardApprovalModelAttributes>('DashboardApprovals');
  }

  /**
   * Find approval by entity type and entity ID
   */
  async findByEntity(
    entityType: EntityType,
    entityId: string
  ): Promise<Result<DashboardApprovalProps | null, Error>> {
    try {
      this.logger.debug('Finding approval by entity', { entityType, entityId });

      const queryBuilder = this.createQueryBuilder();
      const results = await queryBuilder
        .where({ entityType, entityId })
        .execute();

      if (results.length === 0) {
        return Ok(null);
      }

      const domain = this.toDomain(results[0]!);
      return Ok(domain);
    } catch (error) {
      this.logger.error('Error finding approval by entity', error as Error);
      return Err(
        new Error(`Failed to find approval: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Find all pending approvals
   */
  async findPending(
    entityType?: EntityType
  ): Promise<Result<DashboardApprovalProps[], Error>> {
    try {
      this.logger.debug('Finding pending approvals', { entityType });

      const queryBuilder = this.createQueryBuilder();
      const whereClause: any = { status: 'pending' };

      if (entityType) {
        whereClause.entityType = entityType;
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
        new Error(`Failed to find pending approvals: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Find approvals by campaign ID
   */
  async findByCampaignId(
    campaignId: string,
    entityType?: EntityType
  ): Promise<Result<DashboardApprovalProps[], Error>> {
    try {
      this.logger.debug('Finding approvals by campaign ID', { campaignId, entityType });

      const queryBuilder = this.createQueryBuilder();
      const whereClause: any = { campaignId };

      if (entityType) {
        whereClause.entityType = entityType;
      }

      const results = await queryBuilder
        .where(whereClause)
        .orderBy('createdAt', 'DESC')
        .execute();

      const domains = results.map(result => this.toDomain(result));
      return Ok(domains);
    } catch (error) {
      this.logger.error('Error finding approvals by campaign ID', error as Error);
      return Err(
        new Error(`Failed to find approvals: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Find approvals by submitted user
   */
  async findBySubmittedBy(
    userId: string,
    entityType?: EntityType
  ): Promise<Result<DashboardApprovalProps[], Error>> {
    try {
      this.logger.debug('Finding approvals by submitted user', { userId, entityType });

      const queryBuilder = this.createQueryBuilder();
      const whereClause: any = { submittedBy: userId };

      if (entityType) {
        whereClause.entityType = entityType;
      }

      const results = await queryBuilder
        .where(whereClause)
        .orderBy('submittedAt', 'DESC')
        .execute();

      const domains = results.map(result => this.toDomain(result));
      return Ok(domains);
    } catch (error) {
      this.logger.error('Error finding approvals by submitted user', error as Error);
      return Err(
        new Error(`Failed to find approvals: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Submit entity for approval
   */
  async submitForApproval(
    entityType: EntityType,
    entityId: string,
    campaignId: string,
    submittedBy: string
  ): Promise<Result<DashboardApprovalProps, Error>> {
    try {
      this.logger.info('Submitting entity for approval', {
        entityType,
        entityId,
        campaignId,
        submittedBy
      });

      // Check if approval already exists
      const existingResult = await this.findByEntity(entityType, entityId);
      if (existingResult.isErr()) {
        return Err(existingResult.unwrapErr());
      }

      const existing = existingResult.unwrap();

      if (existing) {
                 // Update existing approval to pending status
         const updatedApproval: DashboardApprovalProps = {
           ...existing,
           status: 'pending',
           submittedAt: new Date(),
           submittedBy,
           updatedAt: new Date(),
         };

         // Remove previous review data
         delete (updatedApproval as any).reviewedAt;
         delete (updatedApproval as any).reviewedBy;
         delete (updatedApproval as any).comment;

         const updateResult = await this.ormAdapter.update(
           'DashboardApprovals',
           { id: existing.id },
           this.toPersistence(updatedApproval)
         );

         if (!updateResult) {
           return Err(new Error('Failed to update approval'));
         }

         return Ok(updatedApproval);
      } else {
                 // Create new approval
         const newApproval: DashboardApprovalProps = {
           id: randomUUID(),
           entityType,
           entityId,
           campaignId,
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
   * Review approval (approve or reject)
   */
  async reviewApproval(
    entityType: EntityType,
    entityId: string,
    action: 'approve' | 'reject',
    reviewedBy: string,
    comment?: string
  ): Promise<Result<DashboardApprovalProps, Error>> {
    try {
      this.logger.info('Reviewing approval', {
        entityType,
        entityId,
        action,
        reviewedBy
      });

      // Find existing approval
      const existingResult = await this.findByEntity(entityType, entityId);
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
         { id: existing.id },
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
  async getStatistics(): Promise<Result<{
    pending: number;
    approved: number;
    rejected: number;
    byEntityType: Record<EntityType, { pending: number; approved: number; rejected: number }>;
  }, Error>> {
    try {
      this.logger.debug('Getting approval statistics');

      const queryBuilder = this.createQueryBuilder();
      const results = await queryBuilder.execute();

      const stats = {
        pending: 0,
        approved: 0,
        rejected: 0,
        byEntityType: {
          'dashboard-campaign-summary': { pending: 0, approved: 0, rejected: 0 },
          'dashboard-campaign-info': { pending: 0, approved: 0, rejected: 0 },
        } as Record<EntityType, { pending: number; approved: number; rejected: number }>,
      };

      results.forEach(result => {
        const domain = this.toDomain(result);
        stats[domain.status]++;
        stats.byEntityType[domain.entityType][domain.status]++;
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
