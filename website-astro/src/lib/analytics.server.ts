import { captureServerEvent, getPostHogServer } from './posthog';

export const ServerAnalytics = {
  track(userId: string, event: string, properties?: Record<string, any>): void {
    captureServerEvent(userId, event, properties);
  },

  captureException(userId: string, error: Error, context?: Record<string, any>): void {
    captureServerEvent(userId, '$exception', {
      $exception_type: error.constructor.name,
      $exception_message: error.message,
      $exception_stack_trace_raw: error.stack ?? '',
      ...context,
    });
  },
};
