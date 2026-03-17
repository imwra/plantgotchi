import type { Meta, StoryObj } from '@storybook/react';
import ChatPanel from './ChatPanel';

const DEMO_CONVERSATIONS = [
  { id: '1', name: 'Maria Silva', lastMessage: 'Sua jiboia está linda!', lastMessageTime: '2m', unreadCount: 3, isGroup: false, memberCount: 2 },
  { id: '2', name: 'Grupo: Suculentas SP', lastMessage: 'Alguém tem mudas de echeveria?', lastMessageTime: '1h', unreadCount: 0, isGroup: true, memberCount: 8 },
  { id: '3', name: 'João Santos', lastMessage: 'Valeu pela dica!', lastMessageTime: '3h', unreadCount: 1, isGroup: false, memberCount: 2 },
  { id: '4', name: 'Grupo: Iniciantes', lastMessage: 'Como regar cactos?', lastMessageTime: '1d', unreadCount: 0, isGroup: true, memberCount: 15 },
];

const DEMO_MESSAGES = [
  { id: 'm1', content: 'Oi! Vi sua jiboia no perfil, que linda!', type: 'text' as const, isMine: false, timestamp: '14:30', senderName: 'Maria Silva', senderEmoji: '🌿', reactions: [{ emoji: '❤️', count: 1, reacted: true }] },
  { id: 'm2', content: 'Obrigado! Ela está com 3 anos já', type: 'text' as const, isMine: true, timestamp: '14:32', senderName: 'Você', senderEmoji: '🌱', reactions: [] },
  { id: 'm3', content: 'Nossa, tá enorme! Qual o segredo?', type: 'text' as const, isMine: false, timestamp: '14:33', senderName: 'Maria Silva', senderEmoji: '🌿', reactions: [] },
  { id: 'm4', content: 'Rego toda segunda e quinta, e deixo perto da janela', type: 'text' as const, isMine: true, timestamp: '14:35', senderName: 'Você', senderEmoji: '🌱', reactions: [{ emoji: '👍', count: 1, reacted: false }] },
  { id: 'm5', content: 'https://placeholder.plantgotchi.dev/chat/jiboia.jpg', type: 'image' as const, isMine: true, timestamp: '14:36', senderName: 'Você', senderEmoji: '🌱', reactions: [{ emoji: '😮', count: 2, reacted: false }, { emoji: '❤️', count: 1, reacted: true }] },
];

const meta: Meta<typeof ChatPanel> = {
  title: 'Organisms/ChatPanel',
  component: ChatPanel,
  decorators: [(Story) => <div style={{ height: 600 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof ChatPanel>;

export const Default: Story = {
  args: {
    conversations: DEMO_CONVERSATIONS,
    messages: DEMO_MESSAGES,
    activeConversationId: '1',
  },
};

export const NoActiveConversation: Story = {
  args: {
    conversations: DEMO_CONVERSATIONS,
    messages: [],
  },
};

export const WithTyping: Story = {
  args: {
    conversations: DEMO_CONVERSATIONS,
    messages: DEMO_MESSAGES,
    activeConversationId: '1',
    typingUsers: ['Maria Silva'],
  },
};

export const EmptyState: Story = {
  args: {
    conversations: [],
    messages: [],
  },
};

// ── Edge-to-Edge Layout Comparison ──────────────────────────

export const EdgeToEdge: Story = {
  decorators: [
    (Story) => (
      <div style={{ position: 'fixed', inset: 0, top: 56, background: '#f0ead6' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    conversations: DEMO_CONVERSATIONS,
    messages: DEMO_MESSAGES,
    activeConversationId: '1',
    typingUsers: ['Maria Silva'],
  },
};

export const EdgeToEdgeEmpty: Story = {
  decorators: [
    (Story) => (
      <div style={{ position: 'fixed', inset: 0, top: 56, background: '#f0ead6' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    conversations: DEMO_CONVERSATIONS,
    messages: [],
  },
};
