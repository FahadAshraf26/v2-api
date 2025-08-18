import { inject, injectable } from 'tsyringe';

import { DomainEvent } from '@/domain/core/domain-event';
import { DomainEventHandler } from '@/domain/core/domain-event-handler';

import { LoggerService } from '@/infrastructure/logging/logger.service';

@injectable()
export class EventBus {
  private handlers = new Map<string, DomainEventHandler<any>[]>();

  constructor(@inject(LoggerService) private readonly logger: LoggerService) {}

  register(eventName: string, handler: DomainEventHandler<any>): void {
    const existingHandlers = this.handlers.get(eventName) || [];
    this.handlers.set(eventName, [...existingHandlers, handler]);
    this.logger.info(`Registered handler for event: ${eventName}`);
  }

  async publish(event: DomainEvent): Promise<void> {
    const eventName = event.getEventName();
    const handlers = this.handlers.get(eventName);

    if (handlers && handlers.length > 0) {
      this.logger.debug(
        `Dispatching event: ${eventName} to ${handlers.length} handler(s)`
      );
      await Promise.all(handlers.map(handler => handler.handle(event)));
    } else {
      this.logger.debug(`No handlers found for event: ${eventName}`);
    }
  }
}
