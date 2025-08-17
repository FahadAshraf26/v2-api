import { WebClient } from '@slack/web-api';
import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { NotificationData } from '@/types/dashboard-submission';

@injectable()
export class SlackService {
  private client: WebClient;
  private adminChannel: string;

  constructor(@inject(LoggerService) private readonly logger: LoggerService) {
    const token = process.env['SLACK_BOT_TOKEN'];
    this.adminChannel =
      process.env['SLACK_ADMIN_CHANNEL'] || '#dashboard-submissions';

    if (!token) {
      throw new Error('SLACK_BOT_TOKEN environment variable is required');
    }

    this.client = new WebClient(token);
  }

  /**
   * Send dashboard submission notification to Slack
   */
  async sendSubmissionNotification(
    data: NotificationData
  ): Promise<Result<void, Error>> {
    try {
      this.logger.info('Sending Slack notification for dashboard submission', {
        campaignId: data.campaignId,
        submissionId: data.submissionId,
        entities: data.submittedEntities,
      });

      const message = this.buildSubmissionMessage(data);

      await this.client.chat.postMessage({
        channel: this.adminChannel,
        blocks: message.blocks,
        text: message.fallbackText,
      });

      this.logger.info('Slack notification sent successfully', {
        submissionId: data.submissionId,
      });

      return Ok(undefined);
    } catch (error) {
      this.logger.error('Failed to send Slack notification', error as Error);
      return Err(
        new Error(`Slack notification failed: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Build rich Slack message with blocks
   */
  private buildSubmissionMessage(data: NotificationData) {
    const entitiesText = data.submittedEntities.join(', ');
    const timestamp = Math.floor(data.timestamp.getTime() / 1000);

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🔔 New Dashboard Submission for Review',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Campaign:*\n${data.campaignName || data.campaignId}`,
          },
          {
            type: 'mrkdwn',
            text: `*Submitted By:*\n${data.submittedBy}`,
          },
          {
            type: 'mrkdwn',
            text: `*Entities:*\n${entitiesText}`,
          },
          {
            type: 'mrkdwn',
            text: `*Submission ID:*\n${data.submissionId}`,
          },
        ],
      },
    ];

    if (data.submissionNote) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Note:*\n${data.submissionNote}`,
        },
      });
    }

    blocks.push(
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<!date^${timestamp}^Submitted on {date_pretty} at {time}|${data.timestamp.toISOString()}>`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '📋 Review Submissions',
              emoji: true,
            },
            style: 'primary',
            url: `${process.env['ADMIN_DASHBOARD_URL']}/dashboard/pending-approvals`,
          },
        ],
      }
    );

    return {
      blocks,
      fallbackText: `New dashboard submission for campaign ${data.campaignName || data.campaignId}: ${entitiesText}`,
    };
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
