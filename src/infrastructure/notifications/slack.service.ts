import { WebClient } from '@slack/web-api';
import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { LoggerService } from '@/infrastructure/logging/logger.service';

export interface SlackMessage {
  channel?: string;
  blocks: any[];
  text: string; // Fallback text
}

@injectable()
export class SlackService {
  private client: WebClient;
  private submissionChannel: string;

  constructor(@inject(LoggerService) private readonly logger: LoggerService) {
    const token = process.env['SLACK_BOT_TOKEN'];
    this.submissionChannel =
      process.env['SLACK_SUBMISSION_CHANNEL'] || '#dashboard-submissions';

    if (!token) {
      throw new Error('SLACK_BOT_TOKEN environment variable is required');
    }

    this.client = new WebClient(token);
  }

  /**
   * Send a generic message to Slack
   */
  async sendMessage(message: SlackMessage): Promise<Result<void, Error>> {
    try {
      this.logger.info('Sending Slack message', {
        channel: message.channel,
      });

      await this.client.chat.postMessage({
        channel: message.channel || this.submissionChannel,
        blocks: message.blocks,
        text: message.text,
      });

      this.logger.info('Slack message sent successfully');
      return Ok(undefined);
    } catch (error) {
      this.logger.error('Failed to send Slack message', error as Error);
      return Err(
        new Error(`Slack message failed: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Test Slack connection
   */
  async testConnection(): Promise<Result<void, Error>> {
    try {
      const response = await this.client.auth.test();
      if (response.ok) {
        this.logger.info('Slack connection test successful', {
          user: response.user,
          team: response.team,
        });
        return Ok(undefined);
      } else {
        return Err(new Error('Slack authentication failed'));
      }
    } catch (error) {
      this.logger.error('Slack connection test failed', error as Error);
      return Err(
        new Error(`Slack connection failed: ${(error as Error).message}`)
      );
    }
  }
}
