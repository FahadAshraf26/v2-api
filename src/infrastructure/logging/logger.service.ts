import pino, { Logger } from 'pino';
import { injectable } from 'tsyringe';

@injectable()
export class LoggerService {
  private logger: Logger;

  constructor(logLevel: string = 'info', nodeEnv?: string) {
    this.logger = pino({
      level: logLevel,
      ...(nodeEnv === 'local' && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
          },
        },
      }),
    });
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(meta, message);
  }

  error(message: string, error?: unknown): void {
    if (error instanceof Error) {
      this.logger.error(
        {
          err: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        },
        message
      );
    } else {
      this.logger.error({ err: error }, message);
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(meta, message);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(meta, message);
  }

  fatal(message: string, error?: Error): void {
    this.logger.fatal({ err: error }, message);
  }

  child(bindings: Record<string, unknown>): LoggerService {
    const childLogger = Object.create(this);
    childLogger.logger = this.logger.child(bindings);
    return childLogger;
  }
}
