import { Result, Ok, Err } from 'oxide.ts';

export interface UserProps {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  private constructor(
    private readonly props: Required<Omit<UserProps, 'id'>> & { id?: string }
  ) {}

  static create(props: UserProps): Result<User, Error> {
    // Validation
    if (!props.email || !this.isValidEmail(props.email)) {
      return Err(new Error('Invalid email'));
    }

    if (!props.firstName || props.firstName.trim().length === 0) {
      return Err(new Error('First name is required'));
    }

    if (!props.lastName || props.lastName.trim().length === 0) {
      return Err(new Error('Last name is required'));
    }

    const userProps: Required<Omit<UserProps, 'id'>> & { id?: string } = {
      email: props.email.toLowerCase().trim(),
      firstName: props.firstName.trim(),
      lastName: props.lastName.trim(),
      isActive: props.isActive ?? true,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };

    if (props.id) {
      userProps.id = props.id;
    }

    const user = new User(userProps);

    return Ok(user);
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateEmail(email: string): Result<void, Error> {
    if (!User.isValidEmail(email)) {
      return Err(new Error('Invalid email'));
    }
    this.props.email = email.toLowerCase().trim();
    this.props.updatedAt = new Date();
    return Ok(undefined);
  }

  updateName(firstName: string, lastName: string): Result<void, Error> {
    if (!firstName || firstName.trim().length === 0) {
      return Err(new Error('First name is required'));
    }
    if (!lastName || lastName.trim().length === 0) {
      return Err(new Error('Last name is required'));
    }

    this.props.firstName = firstName.trim();
    this.props.lastName = lastName.trim();
    this.props.updatedAt = new Date();
    return Ok(undefined);
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  toObject(): UserProps {
    const result: UserProps = {
      email: this.props.email,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };

    if (this.props.id) {
      result.id = this.props.id;
    }

    return result;
  }
}
