import { injectable, inject } from 'tsyringe';
import { FastifyRequest, FastifyReply } from 'fastify';

import { CreateUserUseCase } from '@/application/use-cases/user/create-user.use-case';
import { GetUserUseCase } from '@/application/use-cases/user/get-user.use-case';
import { UserService } from '@/application/services/user.service';
import { TOKENS } from '@/config/dependency-injection';
import {
  createUserSchema,
  updateUserSchema,
  getUserParamsSchema,
  getUsersQuerySchema,
  CreateUserRequest,
  UpdateUserRequest,
  GetUserParams,
  GetUsersQuery,
} from '@/presentation/schemas/user.schema';

@injectable()
export class UserController {
  constructor(
    @inject(TOKENS.CreateUserUseCaseToken)
    private readonly createUserUseCase: CreateUserUseCase,
    @inject(TOKENS.GetUserUseCaseToken)
    private readonly getUserUseCase: GetUserUseCase,
    @inject(TOKENS.UserServiceToken)
    private readonly userService: UserService
  ) {}

  async createUser(
    request: FastifyRequest<{ Body: CreateUserRequest }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const validatedData = createUserSchema.parse(request.body);

      const result = await this.createUserUseCase.execute(validatedData);

      if (result.isErr()) {
        await reply.status(400).send({
          error: {
            message: result.unwrapErr().message,
            statusCode: 400,
          },
        });
        return;
      }

      await reply.status(201).send({
        success: true,
        data: result.unwrap(),
      });
    } catch (error) {
      await reply.status(500).send({
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  async getUserById(
    request: FastifyRequest<{ Params: GetUserParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const validatedParams = getUserParamsSchema.parse(request.params);

      const result = await this.getUserUseCase.execute({
        id: validatedParams.id,
      });

      if (result.isErr()) {
        const error = result.unwrapErr();
        const statusCode = error.message === 'User not found' ? 404 : 400;

        await reply.status(statusCode).send({
          error: {
            message: error.message,
            statusCode,
          },
        });
        return;
      }

      await reply.status(200).send({
        success: true,
        data: result.unwrap(),
      });
    } catch (error) {
      await reply.status(500).send({
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  async updateUser(
    request: FastifyRequest<{ Params: GetUserParams; Body: UpdateUserRequest }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const validatedParams = getUserParamsSchema.parse(request.params);
      const validatedData = updateUserSchema.parse(request.body);

      const result = await this.userService.updateUser(
        validatedParams.id,
        validatedData
      );

      if (result.isErr()) {
        const error = result.unwrapErr();
        const statusCode = error.message === 'User not found' ? 404 : 400;

        await reply.status(statusCode).send({
          error: {
            message: error.message,
            statusCode,
          },
        });
        return;
      }

      await reply.status(200).send({
        success: true,
        data: { user: result.unwrap().toObject() },
      });
    } catch (error) {
      await reply.status(500).send({
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  async deleteUser(
    request: FastifyRequest<{ Params: GetUserParams }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const validatedParams = getUserParamsSchema.parse(request.params);

      const result = await this.userService.deleteUser(validatedParams.id);

      if (result.isErr()) {
        const error = result.unwrapErr();
        const statusCode = error.message === 'User not found' ? 404 : 400;

        await reply.status(statusCode).send({
          error: {
            message: error.message,
            statusCode,
          },
        });
        return;
      }

      await reply.status(204).send();
    } catch (error) {
      await reply.status(500).send({
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  async getAllUsers(
    request: FastifyRequest<{ Querystring: GetUsersQuery }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const validatedQuery = getUsersQuerySchema.parse(request.query);

      const result = await this.userService.getAllUsers(
        validatedQuery.limit,
        validatedQuery.offset
      );

      if (result.isErr()) {
        await reply.status(400).send({
          error: {
            message: result.unwrapErr().message,
            statusCode: 400,
          },
        });
        return;
      }

      const users = result.unwrap();

      await reply.status(200).send({
        success: true,
        data: {
          users: users.map(user => user.toObject()),
          pagination: {
            limit: validatedQuery.limit,
            offset: validatedQuery.offset,
            total: users.length,
          },
        },
      });
    } catch (error) {
      await reply.status(500).send({
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }
}
