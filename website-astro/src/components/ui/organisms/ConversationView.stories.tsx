import type { Meta, StoryObj } from '@storybook/react';
import ConversationView from './ConversationView';

const DEMO_MESSAGES = [
  { id: 'm1', content: 'Oi! Vi sua jiboia no perfil, que linda!', type: 'text' as const, isMine: false, timestamp: '14:30', senderName: 'Maria Silva', senderEmoji: '🌿', reactions: [{ emoji: '❤️', count: 1, reacted: true }] },
  { id: 'm2', content: 'Obrigado! Ela está com 3 anos já', type: 'text' as const, isMine: true, timestamp: '14:32', senderName: 'Você', senderEmoji: '🌱', reactions: [] },
  { id: 'm3', content: 'Nossa, tá enorme! Qual o segredo?', type: 'text' as const, isMine: false, timestamp: '14:33', senderName: 'Maria Silva', senderEmoji: '🌿', reactions: [] },
  { id: 'm4', content: 'Rego toda segunda e quinta, e deixo perto da janela', type: 'text' as const, isMine: true, timestamp: '14:35', senderName: 'Você', senderEmoji: '🌱', reactions: [{ emoji: '👍', count: 1, reacted: false }] },
  { id: 'm5', content: 'https://placeholder.plantgotchi.dev/chat/jiboia.jpg', type: 'image' as const, isMine: true, timestamp: '14:36', senderName: 'Você', senderEmoji: '🌱', reactions: [{ emoji: '😮', count: 2, reacted: false }, { emoji: '❤️', count: 1, reacted: true }] },
];

const meta: Meta<typeof ConversationView> = {
  title: 'Organisms/ConversationView',
  component: ConversationView,
  decorators: [(Story) => <div style={{ maxWidth: 600, height: 600 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof ConversationView>;

export const Default: Story = {
  args: {
    messages: DEMO_MESSAGES,
    conversationName: 'Maria Silva',
    isGroup: false,
  },
};

export const GroupChat: Story = {
  args: {
    messages: DEMO_MESSAGES,
    conversationName: 'Grupo: Suculentas SP',
    isGroup: true,
    memberCount: 8,
  },
};

export const WithTyping: Story = {
  args: {
    messages: DEMO_MESSAGES,
    conversationName: 'Maria Silva',
    typingUsers: ['Maria Silva'],
  },
};

export const WithBackButton: Story = {
  args: {
    messages: DEMO_MESSAGES,
    conversationName: 'Maria Silva',
    onBack: () => {},
  },
};

export const Empty: Story = {
  args: {
    messages: [],
    conversationName: 'João Santos',
  },
};
