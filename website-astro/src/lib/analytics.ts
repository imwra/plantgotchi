import posthog from 'posthog-js';

export const Analytics = {
  track(event: string, properties?: Record<string, any>): void {
    posthog.capture(event, properties);
  },

  identify(userId: string, traits: Record<string, any>): void {
    posthog.identify(userId, traits);
  },

  reset(): void {
    posthog.reset();
  },

  captureException(error: Error, context?: Record<string, any>): void {
    posthog.capture('$exception', {
      $exception_type: error.constructor.name,
      $exception_message: error.message,
      $exception_stack_trace_raw: error.stack ?? '',
      ...context,
    });
  },

  log(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, any>): void {
    posthog.capture('log_entry', {
      level,
      message,
      ...context,
    });
  },
};
