import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'tsyringe';

import { SaveDashboardChangesUseCase } from '@/application/use-cases/dashboard/save-dashboard-changes.use-case';
import { SaveDashboardChangesDto } from '@/application/use-cases/dashboard/save-dashboard-changes.use-case';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { BaseController } from '@/presentation/controllers/base.controller';

@injectable()
export class DashboardController extends BaseController {
  constructor(
    @inject(SaveDashboardChangesUseCase)
    private readonly useCase: SaveDashboardChangesUseCase,
    @inject(LoggerService) logger: LoggerService
  ) {
    super(logger);
  }

  async saveChanges(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    await this.execute(request, reply, () => {
      const dto = request.body as SaveDashboardChangesDto;
      return this.useCase.run(dto);
    });
  }
}
