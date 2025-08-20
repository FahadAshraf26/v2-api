import dotenv from 'dotenv';

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { injectable } from 'tsyringe';

import { LoggerService } from '@/infrastructure/logging/logger.service';

@injectable()
export class ConfigService {
  private readonly config: Record<string, string>;

  constructor(private readonly logger: LoggerService) {
    this.config = {};
  }

  async loadConfig(): Promise<void> {
    const nodeEnv = process.env['NODE_ENV'];
    if (nodeEnv === 'production' || nodeEnv === 'development') {
      await this.loadFromGcpSecretManager();
    } else {
      this.loadFromDotenv();
    }
  }

  private loadFromDotenv(): void {
    dotenv.config();
    for (const key in process.env) {
      if (Object.prototype.hasOwnProperty.call(process.env, key)) {
        this.config[key] = process.env[key] as string;
      }
    }
    this.logger.info('Configuration loaded from .env file');
  }

  private async loadFromGcpSecretManager(): Promise<void> {
    const secretName = process.env['GCP_SECRET_NAME'];
    const gcpProjectId = process.env['GCP_PROJECT_ID'];

    if (!secretName || !gcpProjectId) {
      this.logger.error(
        'GCP_SECRET_NAME and GCP_PROJECT_ID must be set in production'
      );
      throw new Error(
        'GCP_SECRET_NAME and GCP_PROJECT_ID must be set in production'
      );
    }

    try {
      const client = new SecretManagerServiceClient();
      const name = `projects/${gcpProjectId}/secrets/${secretName}/versions/latest`;

      const [version] = await client.accessSecretVersion({ name });
      const payload = version.payload?.data?.toString();

      if (payload) {
        const parsedConfig = JSON.parse(payload);
        for (const key in parsedConfig) {
          if (Object.prototype.hasOwnProperty.call(parsedConfig, key)) {
            this.config[key] = parsedConfig[key];
            process.env[key] = parsedConfig[key]; // Also set on process.env for compatibility
          }
        }
        this.logger.info('Configuration loaded from GCP Secret Manager');
      } else {
        throw new Error('Secret payload is empty');
      }
    } catch (error) {
      this.logger.error(
        'Failed to load configuration from GCP Secret Manager',
        error
      );
      throw error;
    }
  }

  get(key: string): string | undefined {
    const value = this.config[key];
    if (value === undefined) {
      this.logger.warn(`Configuration key "${key}" not found`);
    }
    return value;
  }
}
