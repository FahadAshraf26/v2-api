import { FastifyReply } from 'fastify';

import { AppError } from '@/shared/errors';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
  timestamp: string;
  requestId?: string | undefined;
}

export class ResponseUtil {
  static success<T>(
    reply: FastifyReply,
    data: T,
    message = 'Success',
    statusCode = 200,
    requestId?: string
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      requestId,
    };
    reply.status(statusCode).send(response);
  }

  static error(reply: FastifyReply, error: AppError, requestId?: string): void {
    const response: ApiResponse<null> = {
      success: false,
      message: error.message,
      error: {
        code: error.code,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
    reply.status(error.statusCode).send(response);
  }
}
