import type { Meta, StoryObj } from '@storybook/react';
import CreatorDashboard from './CreatorDashboard';

const meta: Meta<typeof CreatorDashboard> = {
  title: 'Organisms/CreatorDashboard',
  component: CreatorDashboard,
};
export default meta;

type Story = StoryObj<typeof CreatorDashboard>;

export const Default: Story = {
  decorators: [
    (Story) => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/creators/me')) {
          return new Response(JSON.stringify({ id: 'c1', display_name: 'GreenThumb Sarah', bio: 'Urban gardener and plant educator' }));
        }
        if (urlStr.includes('/api/courses')) {
          return new Response(JSON.stringify([
            { id: '1', title: 'Indoor Herb Growing 101', slug: 'indoor-herb-101', status: 'published', price_cents: 0, currency: 'USD', enrollment_count: 42, created_at: '2025-11-15T10:00:00Z' },
            { id: '2', title: 'Composting for Small Spaces', slug: 'composting-small-spaces', status: 'draft', price_cents: 1499, currency: 'USD', enrollment_count: 0, created_at: '2026-01-20T14:30:00Z' },
            { id: '3', title: 'Orchid Care Masterclass', slug: 'orchid-care', status: 'published', price_cents: 2999, currency: 'USD', enrollment_count: 11, created_at: '2026-02-10T09:00:00Z' },
          ]));
        }
        return originalFetch(url);
      };
      return <Story />;
    },
  ],
};

export const NoCourses: Story = {
  decorators: [
    (Story) => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/creators/me')) {
          return new Response(JSON.stringify({ id: 'c1', display_name: 'New Creator', bio: '' }));
        }
        if (urlStr.includes('/api/courses')) {
          return new Response(JSON.stringify([]));
        }
        return originalFetch(url);
      };
      return <Story />;
    },
  ],
};

export const NotACreator: Story = {
  decorators: [
    (Story) => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: RequestInfo | URL) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/creators/me')) {
          return new Response(JSON.stringify(null));
        }
        return originalFetch(url);
      };
      return <Story />;
    },
  ],
};
