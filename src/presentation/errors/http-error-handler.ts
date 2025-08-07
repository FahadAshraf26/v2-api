import { DomainError, ValidationError } from '@/domain/errors/base-errors';
import { FastifyReply } from 'fastify';

export class HttpErrorHandler {
  static handle(error: Error, reply: FastifyReply): void {
    if (error instanceof DomainError) {
      reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          type: 'DOMAIN_ERROR',
        },
      });
      return;
    }

    if (error instanceof ValidationError) {
      reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.details,
          type: 'VALIDATION_ERROR',
        },
      });
      return;
    }

    reply.status(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        type: 'SYSTEM_ERROR',
      },
    });
  }
}
