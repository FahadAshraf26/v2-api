import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void => {
  request.log.error(error);

  const statusCode = error.statusCode ?? 500;
  const message = statusCode >= 500 ? 'Internal Server Error' : error.message;

  void reply.status(statusCode).send({
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    },
  });
};
