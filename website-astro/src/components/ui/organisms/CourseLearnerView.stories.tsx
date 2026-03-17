import type { Meta, StoryObj } from '@storybook/react';
import CourseLearnerView from './CourseLearnerView';

const meta: Meta<typeof CourseLearnerView> = {
  title: 'Organisms/CourseLearnerView',
  component: CourseLearnerView,
};
export default meta;

type Story = StoryObj<typeof CourseLearnerView>;

const mockCourse = {
  id: '1',
  title: 'Indoor Herb Growing 101',
  slug: 'indoor-herb-101',
  phases: [
    {
      id: 'p1',
      title: 'Getting Started',
      modules: [
        {
          id: 'm1',
          title: 'Choosing Your Herbs',
          is_preview: 1,
          blocks: [
            {
              id: 'b1',
              block_type: 'video' as const,
              content: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption: 'Overview of the best herbs for indoor growing' }),
              sort_order: 1,
            },
            {
              id: 'b2',
              block_type: 'text' as const,
              content: JSON.stringify({ markdown: '## Top Herbs for Beginners\n\nThe following herbs thrive indoors with minimal care:\n\n- **Basil** - Loves warmth and bright light. Pinch flower buds to encourage leaf growth.\n- **Mint** - Nearly indestructible. Keep in its own container as it spreads aggressively.\n- **Cilantro** - Prefers cooler temperatures. Succession plant every 3 weeks for continuous harvest.\n- **Chives** - Tolerates low light better than most herbs. Snip from the outside in.' }),
              sort_order: 2,
            },
          ],
        },
        {
          id: 'm2',
          title: 'Containers and Soil Mix',
          is_preview: 0,
          blocks: [
            {
              id: 'b3',
              block_type: 'text' as const,
              content: JSON.stringify({ markdown: '## Picking the Perfect Pot\n\nAlways choose containers with drainage holes. Terracotta pots are ideal for herbs because they allow excess moisture to evaporate through the walls, preventing root rot.' }),
              sort_order: 1,
            },
            {
              id: 'b4',
              block_type: 'quiz' as const,
              content: JSON.stringify({
                question: 'Which pot material is best for preventing overwatered herbs?',
                options: ['Plastic', 'Glazed ceramic', 'Terracotta', 'Glass'],
                correct_index: 2,
                explanation: 'Terracotta is porous and wicks moisture away from the soil, making it much harder to overwater your herbs.',
              }),
              sort_order: 2,
            },
          ],
        },
      ],
    },
    {
      id: 'p2',
      title: 'Daily Care',
      modules: [
        {
          id: 'm3',
          title: 'Watering Fundamentals',
          is_preview: 0,
          blocks: [
            {
              id: 'b5',
              block_type: 'text' as const,
              content: JSON.stringify({ markdown: '## The Finger Test\n\nStick your finger about an inch into the soil. If it feels dry, water thoroughly until it drains from the bottom. If it still feels moist, check again tomorrow.' }),
              sort_order: 1,
            },
          ],
        },
      ],
    },
  ],
};

const mockProgress = {
  total_modules: 3,
  completed_modules: 1,
  phases: [
    { phase_id: 'p1', total: 2, completed: 1 },
    { phase_id: 'p2', total: 1, completed: 0 },
  ],
};

export const Default: Story = {
  args: { slug: 'indoor-herb-101' },
  decorators: [
    (Story) => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
        const urlStr = String(url);
        if (urlStr.includes('/progress')) {
          return new Response(JSON.stringify(mockProgress));
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
