import { randomUUID } from 'crypto';
import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { DashboardSocials } from '@/domain/dashboard-socials/entity/dashboard-socials.entity';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';
import { DashboardSocialsRepository } from '@/infrastructure/repositories/dashboard-socials.repository';

import { AppError } from '@/shared/errors/app-error';

import {
  CreateDashboardSocialsDto,
  UpdateDashboardSocialsDto,
} from '@/types/dashboard-socials';

@injectable()
export class DashboardSocialsService {
  constructor(
    @inject(DashboardSocialsRepository)
    private readonly repository: DashboardSocialsRepository,
    @inject(TOKENS.CampaignRepositoryToken)
    private readonly campaignRepository: CampaignRepository,
    @inject(LoggerService) private readonly logger: LoggerService
  ) {}

  /**
   * Create or update dashboard socials
   */
  async createOrUpdate(
    dto: CreateDashboardSocialsDto | UpdateDashboardSocialsDto
  ): Promise<Result<DashboardSocials, Error>> {
    try {
      this.logger.info('Creating or updating dashboard socials', {
        campaignId: dto.campaignId,
      });

      const socials = DashboardSocials.create({
        id: (dto as any).id || randomUUID(),
        campaignId: dto.campaignId,
        linkedIn: dto.linkedIn || undefined,
        twitter: dto.twitter || undefined,
        instagram: dto.instagram || undefined,
        facebook: dto.facebook || undefined,
        tiktok: dto.tiktok || undefined,
        yelp: dto.yelp || undefined,
      });

      if (socials.isErr()) {
        return Err(socials.unwrapErr());
      }

      const saveResult = await this.repository.createOrUpdate(socials.unwrap());

      if (saveResult.isErr()) {
        return Err(saveResult.unwrapErr());
      }

      this.logger.info('Dashboard socials created/updated successfully', {
        id: saveResult.unwrap().id,
        campaignId: dto.campaignId,
      });

      return Ok(saveResult.unwrap());
    } catch (error) {
      this.logger.error(
        'Error creating or updating dashboard socials',
        error as Error
      );
      return Err(
        new Error(
          `Failed to create or update dashboard socials: ${
            (error as Error).message
          }`
        )
      );
    }
  }
}
