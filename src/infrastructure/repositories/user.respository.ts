import { injectable, inject } from 'tsyringe';
import { Result, Ok, Err } from 'oxide.ts';

import { IUserRepository } from '@/domain/repositories/user.repository.interface';
import { User } from '@/domain/entities/user.entity';
import { DatabaseService } from '@/infrastructure/database/database.service';
import { UserModel } from '@/infrastructure/database/models/user.model';
import { TOKENS } from '@/config/dependency-injection';

@injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @inject(TOKENS.DatabaseServiceToken)
    private readonly databaseService: DatabaseService
  ) {}

  async create(user: User): Promise<Result<User, Error>> {
    try {
      const userData = user.toObject();
      const createdUser = await UserModel.create({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: userData.isActive,
      });

      const userResult = User.create({
        id: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        isActive: createdUser.isActive,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      });

      if (userResult.isErr()) {
        return Err(userResult.unwrapErr());
      }

      return Ok(userResult.unwrap());
    } catch (error) {
      return Err(error as Error);
    }
  }

  async findById(id: string): Promise<Result<User | null, Error>> {
    try {
      const userModel = await UserModel.findByPk(id);

      if (!userModel) {
        return Ok(null);
      }

      const userResult = User.create({
        id: userModel.id,
        email: userModel.email,
        firstName: userModel.firstName,
        lastName: userModel.lastName,
        isActive: userModel.isActive,
        createdAt: userModel.createdAt,
        updatedAt: userModel.updatedAt,
      });

      if (userResult.isErr()) {
        return Err(userResult.unwrapErr());
      }

      return Ok(userResult.unwrap());
    } catch (error) {
      return Err(error as Error);
    }
  }

  async findByEmail(email: string): Promise<Result<User | null, Error>> {
    try {
      const userModel = await UserModel.findOne({ where: { email } });

      if (!userModel) {
        return Ok(null);
      }

      const userResult = User.create({
        id: userModel.id,
        email: userModel.email,
        firstName: userModel.firstName,
        lastName: userModel.lastName,
        isActive: userModel.isActive,
        createdAt: userModel.createdAt,
        updatedAt: userModel.updatedAt,
      });

      if (userResult.isErr()) {
        return Err(userResult.unwrapErr());
      }

      return Ok(userResult.unwrap());
    } catch (error) {
      return Err(error as Error);
    }
  }

  async update(user: User): Promise<Result<User, Error>> {
    try {
      if (!user.id) {
        return Err(new Error('User ID is required for update'));
      }

      const userData = user.toObject();
      await UserModel.update(
        {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isActive: userData.isActive ?? true,
        },
        { where: { id: user.id } }
      );

      const updatedUser = await UserModel.findByPk(user.id);
      if (!updatedUser) {
        return Err(new Error('User not found after update'));
      }

      const userResult = User.create({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      });

      if (userResult.isErr()) {
        return Err(userResult.unwrapErr());
      }

      return Ok(userResult.unwrap());
    } catch (error) {
      return Err(error as Error);
    }
  }

  async delete(id: string): Promise<Result<void, Error>> {
    try {
      const deletedCount = await UserModel.destroy({ where: { id } });

      if (deletedCount === 0) {
        return Err(new Error('User not found'));
      }

      return Ok(undefined);
    } catch (error) {
      return Err(error as Error);
    }
  }

  async findAll(limit = 20, offset = 0): Promise<Result<User[], Error>> {
    try {
      const userModels = await UserModel.findAll({
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      const users: User[] = [];
      for (const userModel of userModels) {
        const userResult = User.create({
          id: userModel.id,
          email: userModel.email,
          firstName: userModel.firstName,
          lastName: userModel.lastName,
          isActive: userModel.isActive,
          createdAt: userModel.createdAt,
          updatedAt: userModel.updatedAt,
        });

        if (userResult.isErr()) {
          return Err(userResult.unwrapErr());
        }

        users.push(userResult.unwrap());
      }

      return Ok(users);
    } catch (error) {
      return Err(error as Error);
    }
  }
}
