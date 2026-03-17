import type { Meta, StoryObj } from '@storybook/react';
import CommentItem from './CommentItem';

const meta: Meta<typeof CommentItem> = {
  title: 'Molecules/CommentItem',
  component: CommentItem,
  decorators: [(Story) => <div style={{ maxWidth: 600 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof CommentItem>;

export const Plain: Story = {
  args: {
    id: '1',
    authorName: 'Will Araujo',
    body: 'This looks good! The schematic changes for the LED circuit are solid.',
    createdAt: '2026-03-15T10:30:00Z',
    pinned: false,
    reactions: [],
    isAuthor: false,
  },
};

export const Pinned: Story = {
  args: {
    id: '2',
    authorName: 'Ana Silva',
    body: '**Important:** Make sure to use the WS2812B-2020 variant, not the WS2812B-5050.',
    createdAt: '2026-03-14T08:00:00Z',
    pinned: true,
    reactions: [
      { emoji: '👍', count: 3, hasReacted: true },
    ],
    isAuthor: false,
  },
};

export const WithReactions: Story = {
  args: {
    id: '3',
    authorName: 'Carlos Mendes',
    body: 'The PCB routing is complete. Ready for review!',
    createdAt: '2026-03-16T14:00:00Z',
    pinned: false,
    reactions: [
      { emoji: '🎉', count: 2, hasReacted: false },
      { emoji: '👍', count: 1, hasReacted: true },
      { emoji: '❤️', count: 1, hasReacted: false },
    ],
    isAuthor: false,
  },
};

export const AuthoredByCurrentUser: Story = {
  args: {
    id: '4',
    authorName: 'Will Araujo',
    body: 'I will take care of this today.',
    createdAt: '2026-03-16T09:00:00Z',
    updatedAt: '2026-03-16T09:30:00Z',
    pinned: false,
    reactions: [],
    isAuthor: true,
  },
};
