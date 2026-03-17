import type { Meta, StoryObj } from '@storybook/react';
import MessageBubble from './MessageBubble';

const meta: Meta<typeof MessageBubble> = {
  title: 'Molecules/MessageBubble',
  component: MessageBubble,
  decorators: [(Story) => <div style={{ maxWidth: 500 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof MessageBubble>;

export const TheirMessage: Story = {
  args: {
    content: 'Oi! Vi sua jiboia no perfil, que linda!',
    type: 'text',
    isMine: false,
    timestamp: '14:30',
    senderName: 'Maria Silva',
    senderEmoji: '🌿',
    reactions: [{ emoji: '❤️', count: 1, reacted: true }],
  },
};

export const MyMessage: Story = {
  args: {
    content: 'Obrigado! Ela está com 3 anos já',
    type: 'text',
    isMine: true,
    timestamp: '14:32',
    senderName: 'Você',
    senderEmoji: '🌱',
    reactions: [],
  },
};

export const WithMultipleReactions: Story = {
  args: {
    content: 'https://placeholder.plantgotchi.dev/chat/jiboia.jpg',
    type: 'image',
    isMine: true,
    timestamp: '14:36',
    senderName: 'Você',
    senderEmoji: '🌱',
    reactions: [
      { emoji: '😮', count: 2, reacted: false },
      { emoji: '❤️', count: 1, reacted: true },
    ],
  },
};

export const NoReactions: Story = {
  args: {
    content: 'Nossa, tá enorme! Qual o segredo?',
    type: 'text',
    isMine: false,
    timestamp: '14:33',
    senderName: 'Maria Silva',
    senderEmoji: '🌿',
    reactions: [],
  },
};
