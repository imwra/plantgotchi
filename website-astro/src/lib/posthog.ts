import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  const apiKey = import.meta.env.PUBLIC_POSTHOG_KEY;
  if (!apiKey) return null;

  if (!posthogClient) {
    posthogClient = new PostHog(apiKey, {
      host: import.meta.env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    });
  }
  return posthogClient;
}

export function captureServerEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  const client = getPostHogServer();
  if (!client) return;
  client.capture({
    distinctId: userId,
    event,
    properties: { platform: 'web', ...properties },
  });
}
