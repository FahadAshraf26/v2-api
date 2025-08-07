import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { UserController } from '@/presentation/controllers/user.controller';
import { TOKENS } from '@/config/dependency-injection';

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  const userController = container.resolve<UserController>(
    TOKENS.UserControllerToken
  );

  // Swagger schemas for documentation
  const userSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      isActive: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  };

  const createUserSchema = {
    body: {
      type: 'object',
      required: ['email', 'firstName', 'lastName'],
      properties: {
        email: { type: 'string', format: 'email' },
        firstName: { type: 'string', minLength: 1, maxLength: 50 },
        lastName: { type: 'string', minLength: 1, maxLength: 50 },
      },
    },
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              user: userSchema,
            },
          },
        },
      },
    },
  };

  const getUserSchema = {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', format: 'uuid' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              user: userSchema,
            },
          },
        },
      },
    },
  };

  // POST /users
  fastify.post('/users', {
    schema: createUserSchema,
    handler: userController.createUser.bind(userController),
  });

  // GET /users/:id
  fastify.get('/users/:id', {
    schema: getUserSchema,
    handler: userController.getUserById.bind(userController),
  });

  // PUT /users/:id
  fastify.put('/users/:id', {
    handler: userController.updateUser.bind(userController),
  });

  // DELETE /users/:id
  fastify.delete('/users/:id', {
    handler: userController.deleteUser.bind(userController),
  });

  // GET /users
  fastify.get('/users', {
    handler: userController.getAllUsers.bind(userController),
  });
}
