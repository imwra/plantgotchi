import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    register: vi.fn(),
  },
}));

import posthog from 'posthog-js';
import { Analytics } from '../../src/lib/analytics';

describe('Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('track calls posthog.capture with event and properties', () => {
    Analytics.track('plant_created', { plant_id: '123', species: 'Fern' });
    expect(posthog.capture).toHaveBeenCalledWith('plant_created', {
      plant_id: '123',
      species: 'Fern',
    });
  });

  it('identify calls posthog.identify with userId and traits', () => {
    Analytics.identify('user-1', { email: 'a@b.com', name: 'A' });
    expect(posthog.identify).toHaveBeenCalledWith('user-1', {
      email: 'a@b.com',
      name: 'A',
    });
  });

  it('reset calls posthog.reset', () => {
    Analytics.reset();
    expect(posthog.reset).toHaveBeenCalled();
  });

  it('captureException sends $exception event', () => {
    const err = new Error('test error');
    Analytics.captureException(err, { endpoint: '/api/plants' });
    expect(posthog.capture).toHaveBeenCalledWith('$exception', expect.objectContaining({
      $exception_type: 'Error',
      $exception_message: 'test error',
      endpoint: '/api/plants',
    }));
  });

  it('log sends log_entry event with level and message', () => {
    Analytics.log('warn', 'sync failed', { direction: 'push' });
    expect(posthog.capture).toHaveBeenCalledWith('log_entry', {
      level: 'warn',
      message: 'sync failed',
      direction: 'push',
    });
  });
});
