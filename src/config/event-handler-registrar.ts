import { container } from 'tsyringe';

import { DashboardItemSubmittedForReviewHandler } from '@/infrastructure/events/dashboard-item-submitted-for-review.handler';
import { EventBus } from '@/infrastructure/events/event-bus';

export function registerEventHandlers(): void {
  const eventBus = container.resolve(EventBus);

  // Manually resolve and register each handler
  const dashboardItemSubmittedForReviewHandler = container.resolve(
    DashboardItemSubmittedForReviewHandler
  );

  eventBus.register(
    dashboardItemSubmittedForReviewHandler.eventName,
    dashboardItemSubmittedForReviewHandler
  );
}
