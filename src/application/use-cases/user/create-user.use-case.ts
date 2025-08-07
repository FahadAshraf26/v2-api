import { injectable, inject } from 'tsyringe';
import { Result, Ok, Err } from 'oxide.ts';

import { User } from '@/domain/entities/user.entity';
import { UserService } from '@/application/services/user.service';
import { TOKENS } from '@/config/dependency-injection';

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
}

export interface CreateUserResponse {
  user: ReturnType<User['toObject']>;
}

@injectable()
export class CreateUserUseCase {
  constructor(
    @inject(TOKENS.UserServiceToken)
    private readonly userService: UserService
  ) {}

  async execute(
    request: CreateUserRequest
  ): Promise<Result<CreateUserResponse, Error>> {
    const userResult = await this.userService.createUser({
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
    });

    if (userResult.isErr()) {
      return Err(userResult.unwrapErr());
    }

    const user = userResult.unwrap();

    return Ok({
      user: user.toObject(),
    });
  }
}
