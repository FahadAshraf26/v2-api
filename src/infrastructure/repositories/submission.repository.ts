import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/dependency-injection';

import { Submission } from '@/domain/submission/entity/submission.entity';
import { ISubmissionRepository } from '@/domain/submission/repositories/submission.repository.interface';

import { SubmissionModelAttributes } from '@/infrastructure/database/models/submission.model';
import { EventBus } from '@/infrastructure/events/event-bus';
import { LoggerService } from '@/infrastructure/logging/logger.service';
import { SubmissionMapper } from '@/infrastructure/mappers/submission.mapper';
import type { IORMAdapter } from '@/infrastructure/persistence/orm/orm-adapter.interface';
import { BaseRepository } from '@/infrastructure/repositories/base.repository';

@injectable()
export class SubmissionRepository
  extends BaseRepository<Submission, SubmissionModelAttributes>
  implements ISubmissionRepository
{
  constructor(
    @inject(TOKENS.ORMAdapterToken) ormAdapter: IORMAdapter,
    @inject(LoggerService) logger: LoggerService,
    @inject(EventBus) eventBus: EventBus,
    @inject(TOKENS.SubmissionMapperToken)
    private readonly mapper: SubmissionMapper
  ) {
    super('Submission', ormAdapter, logger, eventBus);
  }

  protected getEntityName(): string {
    return 'Submission';
  }

  protected toDomain(model: SubmissionModelAttributes): Submission {
    return this.mapper.toDomain(model);
  }

  protected toPersistence(domain: Submission): SubmissionModelAttributes {
    return this.mapper.toPersistence(domain);
  }

  protected toPersistenceCriteria(
    domainCriteria: Record<string, any>
  ): Record<string, any> {
    return this.mapper.toPersistenceCriteria(domainCriteria);
  }

  // Implement interface methods
  async findByCampaignId(
    campaignId: string
  ): Promise<Result<Submission[], Error>> {
    try {
      this.logger.debug('Finding submissions by campaign ID', { campaignId });

      const queryBuilder = this.createQueryBuilder();
      const results = await queryBuilder
        .where({ campaignId })
        .orderBy('createdAt', 'DESC')
        .execute();

      const submissions = results.map(result => this.toDomain(result));
      return Ok(submissions);
    } catch (error) {
      this.logger.error(
        'Error finding submissions by campaign ID',
        error as Error
      );
      return Err(
        new Error(`Failed to find submissions: ${(error as Error).message}`)
      );
    }
  }

  async findBySubmittedBy(
    submittedBy: string
  ): Promise<Result<Submission[], Error>> {
    try {
      this.logger.debug('Finding submissions by submitter', { submittedBy });

      const queryBuilder = this.createQueryBuilder();
      const results = await queryBuilder
        .where({ submittedBy })
        .orderBy('createdAt', 'DESC')
        .execute();

      const submissions = results.map(result => this.toDomain(result));
      return Ok(submissions);
    } catch (error) {
      this.logger.error(
        'Error finding submissions by submitter',
        error as Error
      );
      return Err(
        new Error(`Failed to find submissions: ${(error as Error).message}`)
      );
    }
  }

  async findPendingSubmissions(): Promise<Result<Submission[], Error>> {
    try {
      this.logger.debug('Finding pending submissions');

      const queryBuilder = this.createQueryBuilder();
      const results = await queryBuilder
        .where({ status: 'pending' })
        .orderBy('createdAt', 'ASC')
        .execute();

      const submissions = results.map(result => this.toDomain(result));
      return Ok(submissions);
    } catch (error) {
      this.logger.error('Error finding pending submissions', error as Error);
      return Err(
        new Error(
          `Failed to find pending submissions: ${(error as Error).message}`
        )
      );
    }
  }
}
