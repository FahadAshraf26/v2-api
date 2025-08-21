import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { DashboardOwners } from '@/domain/dashboard-owners/entity/dashboard-owners.entity';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';
import { DashboardOwnersRepository } from '@/infrastructure/repositories/dashboard-owners.repository';

import {
  DashboardOwnerDto,
  UpsertDashboardOwnerDto,
} from '@/types/dashboard-owners';

@injectable()
export class DashboardOwnersService {
  constructor(
    @inject(DashboardOwnersRepository)
    private readonly repository: DashboardOwnersRepository,
    @inject(TOKENS.CampaignRepositoryToken)
    private readonly campaignRepository: CampaignRepository,
    @inject(LoggerService) private readonly logger: LoggerService
  ) {}

  async findByCampaignSlug(
    slug: string
  ): Promise<Result<DashboardOwnerDto[], Error>> {
    try {
      this.logger.info('Finding dashboard owners by slug', { slug });
      const result = await this.repository.findByCampaignSlug(slug);
      if (result.isErr()) {
        return Err(result.unwrapErr());
      }
      const owners = result.unwrap();
      if (owners) {
        this.logger.info('Found dashboard owners in dashboard table', {
          slug,
        });
        return Ok(owners.map(owner => this.repository.mapper.toDTO(owner)));
      }
      return Ok([]);
    } catch (error) {
      this.logger.error(
        'Error finding dashboard owners by slug',
        error as Error
      );
      return Err(
        new Error(
          `Failed to find dashboard owners by slug: ${(error as Error).message}`
        )
      );
    }
  }

  async createOrUpdate(
    dtos: UpsertDashboardOwnerDto[],
    campaignId: string
  ): Promise<Result<DashboardOwners[], Error>> {
    try {
      this.logger.info('Creating or updating dashboard owners', {
        campaignId,
      });

      const existingOwnersResult = await this.repository.findMany({
        where: { campaignId },
      });
      if (existingOwnersResult.isErr()) {
        return Err(existingOwnersResult.unwrapErr());
      }
      const existingOwners = existingOwnersResult.unwrap();
      const ownersToCreate: DashboardOwners[] = [];
      const ownersToUpdate: {
        id: string;
        entity: DashboardOwners;
      }[] = [];

      for (const dto of dtos) {
        const existingOwner = existingOwners.find(owner => owner.id === dto.id);
        if (existingOwner && existingOwner.id) {
          const updatedOwner = existingOwner.update(dto);
          if (updatedOwner.isErr()) {
            return Err(updatedOwner.unwrapErr());
          }
          ownersToUpdate.push({
            id: existingOwner.id,
            entity: existingOwner,
          });
        } else {
          const newOwner = DashboardOwners.create({ ...dto, campaignId });
          if (newOwner.isErr()) {
            return Err(newOwner.unwrapErr());
          }
          ownersToCreate.push(newOwner.unwrap());
        }
      }

      const createdOwners = await this.repository.saveMany(ownersToCreate);
      if (createdOwners.isErr()) {
        return Err(createdOwners.unwrapErr());
      }

      const updatedOwners = await Promise.all(
        ownersToUpdate.map(owner =>
          this.repository.update(owner.id, owner.entity)
        )
      );
      const updatedOwnersResult = updatedOwners.find(result => result.isErr());
      if (updatedOwnersResult && updatedOwnersResult.isErr()) {
        return Err(updatedOwnersResult.unwrapErr());
      }

      const allOwners = [
        ...createdOwners.unwrap(),
        ...updatedOwners.map(result => result.unwrap()),
      ];

      this.logger.info('Dashboard owners created/updated successfully', {
        campaignId,
      });

      return Ok(allOwners);
    } catch (error) {
      this.logger.error(
        'Error creating or updating dashboard owners',
        error as Error
      );
      return Err(
        new Error(
          `Failed to create or update dashboard owners: ${
            (error as Error).message
          }`
        )
      );
    }
  }
}
