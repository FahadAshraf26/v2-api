import { Entity } from '@/domain/core/entity';

import { UserProps } from '@/types/user';

export class User extends Entity<UserProps> {
  private constructor(private props: UserProps) {
    super(props.userId);
  }

  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  toObject(): UserProps {
    return this.props;
  }

  get userId(): string {
    return this.props.userId;
  }

  get firstName(): string | null {
    return this.props.firstName;
  }

  get lastName(): string | null {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName || ''} ${this.props.lastName || ''}`.trim();
  }
}
