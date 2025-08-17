import { inject, injectable } from 'tsyringe';

import { TOKENS } from '@/config/dependency-injection';

import { SubmissionCompletedEvent } from '@/domain/submission/events/submission-completed.event';
import { SubmissionSubmittedEvent } from '@/domain/submission/events/submission-submitted.event';

import { LoggerService } from '@/infrastructure/logging/logger.service';
import { EmailService } from '@/infrastructure/notifications/email.service';
import { SlackService } from '@/infrastructure/notifications/slack.service';
import { CampaignRepository } from '@/infrastructure/repositories/campaign.repository';

// Infrastructure concern - handles domain events
@injectable()
export class SubmissionEventHandler {
  constructor(
    @inject(LoggerService) private readonly logger: LoggerService,
    @inject(SlackService) private readonly slackService: SlackService,
    @inject(EmailService) private readonly emailService: EmailService,
    @inject(TOKENS.CampaignRepositoryToken)
    private readonly campaignRepository: CampaignRepository
  ) {}

  async handleSubmissionSubmitted(
    event: SubmissionSubmittedEvent
  ): Promise<void> {
    this.logger.info('Handling submission submitted event', {
      submissionId: event.aggregateId,
      campaignId: event.data.campaignId,
      submittedBy: event.data.submittedBy,
    });

    try {
      // Get campaign details for notifications
      const campaignResult = await this.campaignRepository.findById(
        event.data.campaignId
      );
      const campaign = campaignResult.isOk() ? campaignResult.unwrap() : null;
      const campaignName =
        campaign?.toObject().campaignName || event.data.campaignId;

      // Prepare notification data
      const notificationData = {
        submissionId: event.aggregateId,
        campaignId: event.data.campaignId,
        campaignName,
        submittedBy: event.data.submittedBy,
        submittedItems: event.data.items,
        submissionNote: event.data.submissionNote,
        timestamp: event.occurredAt,
      };

      // Send notifications in parallel (infrastructure concerns)
      await Promise.allSettled([
        this.sendSlackNotification(notificationData),
        this.sendEmailNotifications(notificationData),
      ]);
    } catch (error) {
      this.logger.error('Failed to handle submission submitted event', {
        submissionId: event.aggregateId,
        error: error as Error,
      });
    }
  }

  async handleSubmissionCompleted(
    event: SubmissionCompletedEvent
  ): Promise<void> {
    this.logger.info('Handling submission completed event', {
      submissionId: event.aggregateId,
      campaignId: event.data.campaignId,
      hasSuccessfulItems: event.data.hasSuccessfulItems,
      successfulItems: event.data.successfulItems,
    });

    // Additional completion notifications could be handled here
    // For example: send completion emails, update external systems, etc.
  }

  private async sendSlackNotification(data: any): Promise<void> {
    try {
      const result = await this.slackService.sendSubmissionNotification({
        campaignId: data.campaignId,
        campaignName: data.campaignName,
        submittedBy: data.submittedBy,
        submittedEntities: data.submittedItems,
        submissionNote: data.submissionNote,
        submissionId: data.submissionId,
        timestamp: data.timestamp,
      });

      if (result.isErr()) {
        this.logger.error('Slack notification failed', {
          error: result.unwrapErr(),
        });
      }
    } catch (error) {
      this.logger.error('Slack notification error', { error: error as Error });
    }
  }

  private async sendEmailNotifications(data: any): Promise<void> {
    try {
      const recipients = this.getEmailRecipients();

      const result = await this.emailService.sendSubmissionNotifications(
        {
          campaignId: data.campaignId,
          campaignName: data.campaignName,
          submittedBy: data.submittedBy,
          submittedEntities: data.submittedItems,
          submissionNote: data.submissionNote,
          submissionId: data.submissionId,
          timestamp: data.timestamp,
        },
        recipients
      );

      if (result.isErr()) {
        this.logger.error('Email notifications failed', {
          error: result.unwrapErr(),
        });
      }
    } catch (error) {
      this.logger.error('Email notification error', { error: error as Error });
    }
  }

  private getEmailRecipients() {
    const recipients = [];

    const adminEmail = process.env['ADMIN_EMAIL'];
    if (adminEmail) {
      recipients.push({
        email: adminEmail,
        name: 'Admin',
        role: 'admin' as const,
      });
    }

    const ownerEmail = process.env['OWNER_EMAIL'];
    if (ownerEmail && ownerEmail !== adminEmail) {
      recipients.push({
        email: ownerEmail,
        name: 'Owner',
        role: 'owner' as const,
      });
    }

    return recipients;
  }
}
