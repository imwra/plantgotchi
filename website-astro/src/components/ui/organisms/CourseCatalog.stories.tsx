import type { Meta, StoryObj } from '@storybook/react';
import CourseCatalog from './CourseCatalog';

const meta: Meta<typeof CourseCatalog> = {
  title: 'Organisms/CourseCatalog',
  component: CourseCatalog,
};
export default meta;

type Story = StoryObj<typeof CourseCatalog>;

export const Default: Story = {
  decorators: [
    (Story) => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: RequestInfo | URL) => {
        if (String(url).includes('/api/courses')) {
          return new Response(JSON.stringify([
            { id: '1', title: 'Indoor Herb Growing 101', slug: 'indoor-herb-101', description: 'Learn to grow basil, mint, and cilantro indoors year-round', cover_image_url: null, price_cents: 0, currency: 'USD', creator_name: 'GreenThumb Sarah', enrollment_count: 42 },
            { id: '2', title: 'Advanced Succulent Care', slug: 'advanced-succulents', description: 'Master the art of succulent propagation and arrangement', cover_image_url: null, price_cents: 1999, currency: 'USD', creator_name: 'Desert Rose Mike', enrollment_count: 18 },
            { id: '3', title: 'Tropical Plant Paradise', slug: 'tropical-plants', description: 'Create your own indoor jungle with Monstera, Philodendron, and Pothos', cover_image_url: null, price_cents: 2999, currency: 'USD', creator_name: 'Jungle Jane', enrollment_count: 7 },
          ]));
        }
        return originalFetch(url);
      };
      return <Story />;
    },
  ],
};

export const Empty: Story = {
  decorators: [
    (Story) => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: RequestInfo | URL) => {
        if (String(url).includes('/api/courses')) {
          return new Response(JSON.stringify([]));
        }
        return originalFetch(url);
      };
      return <Story />;
    },
  ],
};
