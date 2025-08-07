import { injectable, inject } from 'tsyringe';
import { Result, Ok, Err } from 'oxide.ts';

import { User } from '@/domain/entities/user.entity';
import type { IUserRepository } from '@/domain/repositories/user.repository.interface';
import { CacheService } from '@/infrastructure/cache/cache.service';
import { TOKENS } from '@/config/dependency-injection';
import { config } from '@/config/app';

@injectable()
export class UserService {
  constructor(
    @inject(TOKENS.UserRepositoryToken)
    private readonly userRepository: IUserRepository,
    @inject(TOKENS.CacheServiceToken)
    private readonly cacheService: CacheService
  ) {}

  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<Result<User, Error>> {
    // Check if user already exists
    const existingUserResult = await this.userRepository.findByEmail(
      userData.email
    );
    if (existingUserResult.isErr()) {
      return Err(existingUserResult.unwrapErr());
    }

    if (existingUserResult.unwrap() !== null) {
      return Err(new Error('User with this email already exists'));
    }

    // Create user entity
    const userResult = User.create(userData);
    if (userResult.isErr()) {
      return Err(userResult.unwrapErr());
    }

    // Save to database
    const createdUserResult = await this.userRepository.create(
      userResult.unwrap()
    );
    if (createdUserResult.isErr()) {
      return Err(createdUserResult.unwrapErr());
    }

    const createdUser = createdUserResult.unwrap();

    // Cache the user
    if (createdUser.id) {
      await this.cacheService.set(
        `user:${createdUser.id}`,
        createdUser.toObject(),
        config.CACHE_TTL_DEFAULT
      );
    }

    return Ok(createdUser);
  }

  async getUserById(id: string): Promise<Result<User | null, Error>> {
    // Try to get from cache first
    const cacheResult = await this.cacheService.get<
      ReturnType<User['toObject']>
    >(`user:${id}`);
    if (cacheResult.isOk() && cacheResult.unwrap() !== null) {
      const cachedData = cacheResult.unwrap()!;
      const userResult = User.create(cachedData);
      if (userResult.isOk()) {
        return Ok(userResult.unwrap());
      }
    }

    // Get from database
    const userResult = await this.userRepository.findById(id);
    if (userResult.isErr()) {
      return Err(userResult.unwrapErr());
    }

    const user = userResult.unwrap();
    if (user) {
      // Cache the user
      await this.cacheService.set(
        `user:${id}`,
        user.toObject(),
        config.CACHE_TTL_DEFAULT
      );
    }

    return Ok(user);
  }

  async getUserByEmail(email: string): Promise<Result<User | null, Error>> {
    return await this.userRepository.findByEmail(email);
  }

  async updateUser(
    id: string,
    userData: {
      email?: string | undefined;
      firstName?: string | undefined;
      lastName?: string | undefined;
    }
  ): Promise<Result<User, Error>> {
    // Get existing user
    const existingUserResult = await this.userRepository.findById(id);
    if (existingUserResult.isErr()) {
      return Err(existingUserResult.unwrapErr());
    }

    const existingUser = existingUserResult.unwrap();
    if (!existingUser) {
      return Err(new Error('User not found'));
    }

    // Update email if provided
    if (userData.email && userData.email !== existingUser.email) {
      const emailUpdateResult = existingUser.updateEmail(userData.email);
      if (emailUpdateResult.isErr()) {
        return Err(emailUpdateResult.unwrapErr());
      }
    }

    // Update name if provided
    if (userData.firstName || userData.lastName) {
      const firstName = userData.firstName ?? existingUser.firstName;
      const lastName = userData.lastName ?? existingUser.lastName;
      const nameUpdateResult = existingUser.updateName(firstName, lastName);
      if (nameUpdateResult.isErr()) {
        return Err(nameUpdateResult.unwrapErr());
      }
    }

    // Save to database
    const updatedUserResult = await this.userRepository.update(existingUser);
    if (updatedUserResult.isErr()) {
      return Err(updatedUserResult.unwrapErr());
    }

    const updatedUser = updatedUserResult.unwrap();

    // Update cache
    await this.cacheService.set(
      `user:${id}`,
      updatedUser.toObject(),
      config.CACHE_TTL_DEFAULT
    );

    return Ok(updatedUser);
  }

  async deleteUser(id: string): Promise<Result<void, Error>> {
    const deleteResult = await this.userRepository.delete(id);
    if (deleteResult.isErr()) {
      return Err(deleteResult.unwrapErr());
    }

    // Remove from cache
    await this.cacheService.delete(`user:${id}`);

    return Ok(undefined);
  }

  async getAllUsers(limit = 20, offset = 0): Promise<Result<User[], Error>> {
    return await this.userRepository.findAll(limit, offset);
  }
}
