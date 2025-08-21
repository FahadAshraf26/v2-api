import { randomUUID } from 'crypto';
import { Ok, Result } from 'oxide.ts';

import { AggregateRoot } from '@/domain/core/aggregate-root';

import { OwnerProps } from '@/types/owner';

export class Owner extends AggregateRoot<OwnerProps> {
  private constructor(private readonly props: OwnerProps) {
    super(props.ownerId);
  }

  static create(props: Omit<OwnerProps, 'id'>): Result<Owner, Error> {
    const owner = new Owner({
      ...props,
      ownerId: randomUUID(),
    });
    return Ok(owner);
  }

  public static fromPersistence(props: OwnerProps): Owner {
    return new Owner(props);
  }

  get title(): string {
    return this.props.title || '';
  }

  get subTitle(): string {
    return this.props.subTitle || '';
  }

  get description(): string {
    return this.props.description || '';
  }

  toObject(): OwnerProps {
    return { ...this.props };
  }
}
