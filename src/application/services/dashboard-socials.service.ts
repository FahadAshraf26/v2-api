import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { DashboardSocials } from '@/domain/dashboard-socials/entity/dashboard-socials.entity';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';
import { DashboardSocialsRepository } from '@/infrastructure/repositories/dashboard-socials.repository';
import { IssuerRepository } from '@/infrastructure/repositories/issuer.repository';

import { AppError } from '@/shared/errors/app-error';

import {
  CreateDashboardSocialsDto,
  DashboardSocialsDto,
  UpdateDashboardSocialsDto,
} from '@/types/dashboard-socials';

@injectable()
export class DashboardSocialsService {
  constructor(
    @inject(DashboardSocialsRepository)
    private readonly repository: DashboardSocialsRepository,
    @inject(TOKENS.CampaignRepositoryToken)
    private readonly campaignRepository: CampaignRepository,
    @inject(LoggerService) private readonly logger: LoggerService,
    @inject(TOKENS.IssuerRepositoryToken)
    private readonly issuerRepository: IssuerRepository
  ) {}

  /**
   * Find dashboard socials by campaign slug
   */
  async findByCampaignSlug(
    slug: string
  ): Promise<Result<DashboardSocialsDto, Error>> {
    try {
      this.logger.info('Finding dashboard socials by slug', { slug });

      const result = await this.repository.findByCampaignSlug(slug);

      if (result.isErr()) {
        return Err(result.unwrapErr());
      }

      const socials = result.unwrap();

      if (socials) {
        this.logger.info('Found dashboard socials in dashboard table', {
          slug,
        });
        return Ok(this.repository.mapper.toDTO(socials));
      }

      this.logger.info(
        'Dashboard socials not found in dashboard table, falling back to issuer table',
        { slug }
      );

      const campaignResult = await this.campaignRepository.findOne({
        where: { slug },
      });

      if (campaignResult.isErr()) {
        return Err(campaignResult.unwrapErr());
      }

      const campaign = campaignResult.unwrap();

      if (!campaign) {
        return Err(new AppError(`Campaign not found for slug: ${slug}`));
      }

      const issuerResult = await this.issuerRepository.findOne({
        where: { id: campaign.issuerId },
      });

      if (issuerResult.isErr()) {
        return Err(issuerResult.unwrapErr());
      }

      const issuer = issuerResult.unwrap();

      if (!issuer) {
        return Err(new AppError(`Issuer not found for campaign slug: ${slug}`));
      }

      this.logger.info('Found issuer in issuer table', { slug });

      return Ok(
        this.repository.mapper.toDTO(issuer as unknown as DashboardSocials)
      );
    } catch (error) {
      this.logger.error(
        'Error finding dashboard socials by slug',
        error as Error
      );
      return Err(
        new Error(
          `Failed to find dashboard socials by slug: ${
            (error as Error).message
          }`
        )
      );
    }
  }

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

      const savedSocials = saveResult.unwrap();

      this.logger.info('Dashboard socials created/updated successfully', {
        id: savedSocials.id,
        campaignId: dto.campaignId,
      });

      return Ok(savedSocials);
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
