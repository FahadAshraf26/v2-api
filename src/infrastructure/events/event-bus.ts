import { injectable } from 'tsyringe';
import { DomainEvent } from '@/domain/core/domain-event';

export interface IEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

@injectable()
export class EventBus {
  private handlers = new Map<string, IEventHandler<any>[]>();

  register<T extends DomainEvent>(
    eventName: string,
    handler: IEventHandler<T>
  ): void {
    const handlers = this.handlers.get(eventName) || [];
    handlers.push(handler);
    this.handlers.set(eventName, handlers);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.getEventName()) || [];

    await Promise.all(handlers.map(handler => handler.handle(event)));
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.publish(event)));
  }
}
