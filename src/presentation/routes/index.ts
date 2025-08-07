import { FastifyInstance } from 'fastify';

import { userRoutes } from './user.routes';

export default async function routes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(userRoutes);
}
