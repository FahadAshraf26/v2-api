import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { Err, Ok, Result } from 'oxide.ts';
import { inject, injectable } from 'tsyringe';

import { LoggerService } from '@/infrastructure/logging/logger.service';

import { EmailRecipient, NotificationData } from '@/types/dashboard-submission';

@injectable()
export class EmailService {
  private mailgun: any;
  private domain: string;
  private fromEmail: string;

  constructor(@inject(LoggerService) private readonly logger: LoggerService) {
    const apiKey = process.env['MAILGUN_API_KEY'];
    this.domain = process.env['MAILGUN_DOMAIN'] || '';
    this.fromEmail = process.env['FROM_EMAIL'] || '';

    if (!apiKey || !this.domain) {
      throw new Error(
        'MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables are required'
      );
    }

    const mg = new Mailgun(formData);
    this.mailgun = mg.client({
      username: 'api',
      key: apiKey,
    });
  }

  /**
   * Send dashboard submission email notifications
   */
  async sendSubmissionNotifications(
    data: NotificationData,
    recipients: EmailRecipient[]
  ): Promise<Result<string[], Error>> {
    try {
      this.logger.info('Sending email notifications for dashboard submission', {
        campaignId: data.campaignId,
        submissionId: data.submissionId,
        recipientCount: recipients.length,
      });

      const emailPromises = recipients.map(recipient =>
        this.sendSubmissionEmail(data, recipient)
      );

      const results = await Promise.allSettled(emailPromises);
      const successful: string[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(recipients[index]?.email || '');
        } else {
          const email = recipients[index]?.email || 'unknown';
          const reason = result.reason as Error;
          errors.push(`${email}: ${reason.message}`);
          this.logger.error('Failed to send email', {
            email,
            error: reason,
          });
        }
      });

      if (errors.length > 0 && successful.length === 0) {
        return Err(new Error(`All emails failed: ${errors.join(', ')}`));
      }

      if (errors.length > 0) {
        this.logger.warn('Some emails failed to send', { errors });
      }

      this.logger.info('Email notifications completed', {
        successful: successful.length,
        failed: errors.length,
      });

      return Ok(successful);
    } catch (error) {
      this.logger.error('Failed to send email notifications', error as Error);
      return Err(
        new Error(`Email notification failed: ${(error as Error).message}`)
      );
    }
  }

  /**
   * Send individual submission email
   */
  private async sendSubmissionEmail(
    data: NotificationData,
    recipient: EmailRecipient
  ): Promise<void> {
    const isAdmin = recipient.role === 'admin';
    const subject = this.buildEmailSubject(data);
    const { html, text } = this.buildEmailContent(data, recipient);

    const emailData = {
      from: `Honeycomb Dashboard <${this.fromEmail}>`,
      to: `${recipient.name || ''} <${recipient.email}>`.trim(),
      subject,
      html,
      text,
      'o:tag': ['dashboard-submission'],
      'o:tracking': true,
      'v:submission_id': data.submissionId,
      'v:campaign_id': data.campaignId,
      'v:recipient_role': recipient.role,
    };

    try {
      const response = await this.mailgun.messages.create(
        this.domain,
        emailData
      );
      this.logger.debug('Email sent successfully', {
        messageId: response.id,
        recipient: recipient.email,
      });
    } catch (error) {
      this.logger.error('Failed to send individual email', {
        recipient: recipient.email,
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Build email subject
   */
  private buildEmailSubject(data: NotificationData): string {
    const entitiesText = data.submittedEntities.join(', ');
    return `[Dashboard Review] New Submission: ${entitiesText} - ${data.campaignName || data.campaignId}`;
  }

  /**
   * Build email content (HTML and text)
   */
  private buildEmailContent(data: NotificationData, recipient: EmailRecipient) {
    const isAdmin = recipient.role === 'admin';
    const entitiesText = data.submittedEntities.join(', ');
    const adminDashboardUrl = process.env['ADMIN_DASHBOARD_URL'] || '#';

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Dashboard Submission for Review</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #495057; }
        .value { margin-top: 5px; }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
        }
        .note { background: #fff3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #ffc107; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 New Dashboard Submission for Review</h1>
            <p>A new dashboard submission has been submitted for review and requires your attention.</p>
        </div>

        <div class="content">
            <div class="field">
                <div class="label">Campaign:</div>
                <div class="value">${data.campaignName || data.campaignId}</div>
            </div>

            <div class="field">
                <div class="label">Submitted By:</div>
                <div class="value">${data.submittedBy}</div>
            </div>

            <div class="field">
                <div class="label">Submitted Entities:</div>
                <div class="value">${entitiesText}</div>
            </div>

            <div class="field">
                <div class="label">Submission ID:</div>
                <div class="value">${data.submissionId}</div>
            </div>

            <div class="field">
                <div class="label">Submitted At:</div>
                <div class="value">${data.timestamp.toLocaleString()}</div>
            </div>

            ${
              data.submissionNote
                ? `
            <div class="note">
                <div class="label">Submission Note:</div>
                <div class="value">${data.submissionNote}</div>
            </div>
            `
                : ''
            }

            ${
              isAdmin
                ? `
            <a href="${adminDashboardUrl}/dashboard/pending-approvals" class="button">
                📋 Review Submissions
            </a>
            `
                : ''
            }
        </div>

        <div class="footer">
            <p><strong>What happens next?</strong></p>
            ${
              isAdmin
                ? `
            <p>Please review the submitted dashboard changes in the admin panel. You can approve or reject each submission individually.</p>
            `
                : `
            <p>Your dashboard submission is now pending review. You'll receive an email notification once the review is complete.</p>
            `
            }
            <p>This is an automated notification from the Honeycomb Dashboard system.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Dashboard Submission for Review

A new dashboard submission has been submitted for review.

Campaign: ${data.campaignName || data.campaignId}
Submitted By: ${data.submittedBy}
Submitted Entities: ${entitiesText}
Submission ID: ${data.submissionId}
Submitted At: ${data.timestamp.toLocaleString()}

${data.submissionNote ? `Submission Note: ${data.submissionNote}\n\n` : ''}

${isAdmin ? `Review submissions at: ${adminDashboardUrl}/dashboard/pending-approvals\n\n` : ''}

What happens next?
${
  isAdmin
    ? 'Please review the submitted dashboard changes in the admin panel. You can approve or reject each submission individually.'
    : "Your dashboard submission is now pending review. You'll receive an email notification once the review is complete."
}

This is an automated notification from the Honeycomb Dashboard system.
`;

    return { html, text };
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<Result<void, Error>> {
    try {
      // Test by getting domain information
      const response = await this.mailgun.domains.get(this.domain);

      this.logger.info('Mailgun connection test successful', {
        domain: response?.name || this.domain,
        state: response?.state || 'unknown',
      });

      return Ok(undefined);
    } catch (error) {
      this.logger.error('Mailgun connection test failed', error as Error);
      return Err(
        new Error(`Mailgun connection failed: ${(error as Error).message}`)
      );
    }
  }
}
