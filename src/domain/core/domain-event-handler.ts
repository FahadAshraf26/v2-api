import { DomainEvent } from './domain-event';

export interface DomainEventHandler<T extends DomainEvent> {
  eventName: string;
  handle(event: T): Promise<void>;
}
