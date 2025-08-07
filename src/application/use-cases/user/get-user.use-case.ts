import { injectable, inject } from 'tsyringe';
import { Result, Ok, Err } from 'oxide.ts';

import { User } from '@/domain/entities/user.entity';
import { UserService } from '@/application/services/user.service';
import { TOKENS } from '@/config/dependency-injection';

export interface GetUserRequest {
  id: string;
}

export interface GetUserResponse {
  user: ReturnType<User['toObject']>;
}

@injectable()
export class GetUserUseCase {
  constructor(
    @inject(TOKENS.UserServiceToken)
    private readonly userService: UserService
  ) {}

  async execute(
    request: GetUserRequest
  ): Promise<Result<GetUserResponse, Error>> {
    const userResult = await this.userService.getUserById(request.id);

    if (userResult.isErr()) {
      return Err(userResult.unwrapErr());
    }

    const user = userResult.unwrap();
    if (!user) {
      return Err(new Error('User not found'));
    }

    return Ok({
      user: user.toObject(),
    });
  }
}
