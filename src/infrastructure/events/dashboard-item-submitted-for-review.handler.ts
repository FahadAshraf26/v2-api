/// <reference types="node" />
import { Block, KnownBlock } from '@slack/web-api';
import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/tokens';

import { DomainEventHandler } from '@/domain/core/domain-event-handler';
import { DashboardItemSubmittedForReviewEvent } from '@/domain/submission/events/dashboard-item-submitted-for-review.event';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import {
  SlackMessage,
  SlackService,
} from '@/infrastructure/notifications/slack.service';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';
import { UserRepository } from '@/infrastructure/repositories/user.repository';

@injectable()
export class DashboardItemSubmittedForReviewHandler
  implements DomainEventHandler<DashboardItemSubmittedForReviewEvent>
{
  constructor(
    @inject(SlackService) private readonly slackService: SlackService,
    @inject(TOKENS.CampaignRepositoryToken)
    private readonly campaignRepository: CampaignRepository,
    @inject(TOKENS.UserRepositoryToken)
    private readonly userRepository: UserRepository,
    @inject(LoggerService) private readonly logger: LoggerService
  ) {}

  public eventName = DashboardItemSubmittedForReviewEvent.eventName;

  public async handle(
    event: DashboardItemSubmittedForReviewEvent
  ): Promise<void> {
    this.logger.debug('Handling DashboardItemSubmittedForReviewEvent', {
      event,
    });

    try {
      const [campaignResult, userResult] = await Promise.all([
        this.campaignRepository.findById(event.campaignId),
        this.userRepository.findById(event.userId),
      ]);

      if (campaignResult.isErr()) {
        this.logger.error(
          'Failed to fetch campaign for Slack notification',
          campaignResult.unwrapErr()
        );
        return;
      }

      if (userResult.isErr()) {
        this.logger.error(
          'Failed to fetch user for Slack notification',
          userResult.unwrapErr()
        );
        return;
      }

      const campaign = campaignResult.unwrap();
      const user = userResult.unwrap();

      if (!campaign) {
        this.logger.warn('Campaign not found for Slack notification', {
          campaignId: event.campaignId,
        });
        return;
      }

      const userName = user
        ? `${user.firstName} ${user.lastName}`
        : event.userId;

      const message = this.buildSlackMessage(
        event,
        campaign.campaignName,
        userName
      );
      const slackResult = await this.slackService.sendMessage(message);

      if (slackResult.isErr()) {
        this.logger.error(
          'Failed to send Slack notification from handler',
          slackResult.unwrapErr()
        );
      } else {
        this.logger.debug('Slack notification sent successfully from handler');
      }
    } catch (error) {
      this.logger.error(
        'An unexpected error occurred in DashboardItemSubmittedForReviewHandler',
        error
      );
    }
  }

  private buildSlackMessage(
    event: DashboardItemSubmittedForReviewEvent,
    campaignName: string,
    userName: string
  ): SlackMessage {
    const timestamp = Math.floor(event.timestamp.getTime() / 1000);

    const blocks: (Block | KnownBlock)[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🔔 New Offering Submission for Review',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${userName}* has submitted the offering *${campaignName}* for review.`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Entities Submitted:*\n• ${event.entityTypes.join('\n• ')}`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<!date^${timestamp}^Submitted on {date_pretty} at {time}|${event.timestamp.toISOString()}>`,
          },
        ],
      },
    ];

    const adminUrl = process.env['ADMIN_DASHBOARD_URL'];
    if (adminUrl) {
      blocks.push({
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
            url: `${adminUrl}/dashboard/pending-approvals`,
          },
        ],
      });
    }

    return {
      blocks,
      text: `New dashboard submission for campaign ${campaignName}: ${event.entityTypes.join(
        ', '
      )}`,
    };
  }
}
