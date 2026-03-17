import type { Meta, StoryObj } from '@storybook/react';
import CourseLandingPage from './CourseLandingPage';

const meta: Meta<typeof CourseLandingPage> = {
  title: 'Organisms/CourseLandingPage',
  component: CourseLandingPage,
};
export default meta;

type Story = StoryObj<typeof CourseLandingPage>;

const mockCourse = {
  id: '1',
  title: 'Indoor Herb Growing 101',
  slug: 'indoor-herb-101',
  description: 'A comprehensive guide to growing fresh herbs in your kitchen, balcony, or windowsill. You will learn soil preparation, lighting needs, watering schedules, and harvesting techniques for basil, mint, cilantro, rosemary, and thyme.',
  cover_image_url: null,
  price_cents: 0,
  currency: 'USD',
  status: 'published',
  creator_name: 'GreenThumb Sarah',
  phases: [
    {
      id: 'p1',
      title: 'Getting Started',
      description: 'Set up your indoor herb garden from scratch',
      modules: [
        { id: 'm1', title: 'Choosing Your Herbs', is_preview: 1 },
        { id: 'm2', title: 'Containers and Soil Mix', is_preview: 1 },
        { id: 'm3', title: 'Light and Placement', is_preview: 0 },
      ],
    },
    {
      id: 'p2',
      title: 'Daily Care',
      description: 'Keep your herbs thriving with proper daily routines',
      modules: [
        { id: 'm4', title: 'Watering Fundamentals', is_preview: 0 },
        { id: 'm5', title: 'Feeding and Fertilizing', is_preview: 0 },
        { id: 'm6', title: 'Pruning for Growth', is_preview: 0 },
      ],
    },
    {
      id: 'p3',
      title: 'Harvest and Enjoy',
      description: 'When and how to harvest for maximum flavor',
      modules: [
        { id: 'm7', title: 'Harvesting Techniques', is_preview: 0 },
        { id: 'm8', title: 'Storing Fresh Herbs', is_preview: 0 },
      ],
    },
  ],
};

export const Default: Story = {
  args: { slug: 'indoor-herb-101' },
  decorators: [
    (Story) => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/courses/indoor-herb-101/progress')) {
          return new Response(null, { status: 404 });
        }
        if (urlStr.includes('/api/courses/indoor-herb-101')) {
          return new Response(JSON.stringify(mockCourse));
        }
        return originalFetch(url, init);
      };
      return <Story />;
    },
  ],
};

export const Enrolled: Story = {
  args: { slug: 'indoor-herb-101' },
  decorators: [
    (Story) => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/courses/indoor-herb-101/progress')) {
          return new Response(JSON.stringify({ total_modules: 8, completed_modules: 3 }));
        }
        if (urlStr.includes('/api/courses/indoor-herb-101')) {
          return new Response(JSON.stringify(mockCourse));
        }
        return originalFetch(url, init);
      };
      return <Story />;
    },
  ],
};

export const PaidCourse: Story = {
  args: { slug: 'advanced-succulents' },
  decorators: [
    (Story) => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
        const urlStr = String(url);
        if (urlStr.includes('/progress')) {
          return new Response(null, { status: 404 });
        }
        if (urlStr.includes('/api/courses/advanced-succulents')) {
          return new Response(JSON.stringify({
            ...mockCourse,
            id: '2',
            title: 'Advanced Succulent Care',
            slug: 'advanced-succulents',
            description: 'Deep dive into succulent propagation, pest management, and artistic arrangement. Perfect for plant parents ready to level up their collection.',
            price_cents: 1999,
            creator_name: 'Desert Rose Mike',
          }));
        }
        return originalFetch(url, init);
      };
      return <Story />;
    },
  ],
};
