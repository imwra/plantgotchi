import type { Meta, StoryObj } from '@storybook/react';
import CourseEditor from './CourseEditor';

const meta: Meta<typeof CourseEditor> = {
  title: 'Organisms/CourseEditor',
  component: CourseEditor,
};
export default meta;

type Story = StoryObj<typeof CourseEditor>;

export const NewCourse: Story = {
  args: {},
};

export const EditExisting: Story = {
  args: { slug: 'bonsai-fundamentals' },
  decorators: [
    (Story) => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
        const urlStr = String(url);
        if (urlStr.includes('/api/courses/bonsai-fundamentals')) {
          return new Response(JSON.stringify({
            id: '4',
            title: 'Bonsai Fundamentals',
            slug: 'bonsai-fundamentals',
            description: 'Learn the ancient art of bonsai from selecting your first tree to advanced shaping techniques. Covers Ficus, Juniper, and Japanese Maple varieties.',
            price_cents: 3999,
            currency: 'USD',
            status: 'draft',
            cover_image_url: null,
            phases: [
              {
                id: 'p1',
                title: 'Choosing Your First Bonsai',
                description: 'Find the right species for your climate and skill level',
                sort_order: 1,
                modules: [
                  {
                    id: 'm1',
                    title: 'Indoor vs Outdoor Species',
                    is_preview: 1,
                    blocks: [
                      { id: 'b1', block_type: 'text', content: JSON.stringify({ markdown: '## Indoor Bonsai\n\nFicus, Chinese Elm, and Jade are excellent choices for indoor growing. They tolerate lower light and consistent temperatures.' }), sort_order: 1 },
                      { id: 'b2', block_type: 'video', content: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption: 'Comparing the top 5 indoor bonsai species' }), sort_order: 2 },
                    ],
                  },
                  {
                    id: 'm2',
                    title: 'Evaluating Nursery Stock',
                    is_preview: 0,
                    blocks: [
                      { id: 'b3', block_type: 'text', content: JSON.stringify({ markdown: 'When selecting nursery stock for bonsai, look for trees with a thick trunk base (nebari), interesting movement, and healthy foliage.' }), sort_order: 1 },
                    ],
                  },
                ],
              },
              {
                id: 'p2',
                title: 'Basic Shaping Techniques',
                description: 'Pruning, wiring, and styling your bonsai',
                sort_order: 2,
                modules: [
                  {
                    id: 'm3',
                    title: 'Structural Pruning',
                    is_preview: 0,
                    blocks: [
                      { id: 'b4', block_type: 'text', content: JSON.stringify({ markdown: '## When to Prune\n\nStructural pruning is best done in late winter while the tree is dormant. This reduces stress and allows the tree to heal before the growing season.' }), sort_order: 1 },
                      { id: 'b5', block_type: 'quiz', content: JSON.stringify({ question: 'When is the best time for structural bonsai pruning?', options: ['Midsummer', 'Late winter dormancy', 'During active spring growth', 'Early fall'], correct_index: 1, explanation: 'Late winter dormancy minimizes stress and gives the tree a full growing season to recover.' }), sort_order: 2 },
                    ],
                  },
                ],
              },
            ],
          }));
        }
        return originalFetch(url, init);
      };
      return <Story />;
    },
  ],
};
