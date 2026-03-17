import type { Meta, StoryObj } from '@storybook/react';
import ConversationList from './ConversationList';

const DEMO_CONVERSATIONS = [
  { id: '1', name: 'Maria Silva', lastMessage: 'Sua jiboia está linda!', lastMessageTime: '2m', unreadCount: 3, isGroup: false, memberCount: 2 },
  { id: '2', name: 'Grupo: Suculentas SP', lastMessage: 'Alguém tem mudas de echeveria?', lastMessageTime: '1h', unreadCount: 0, isGroup: true, memberCount: 8 },
  { id: '3', name: 'João Santos', lastMessage: 'Valeu pela dica!', lastMessageTime: '3h', unreadCount: 1, isGroup: false, memberCount: 2 },
  { id: '4', name: 'Grupo: Iniciantes', lastMessage: 'Como regar cactos?', lastMessageTime: '1d', unreadCount: 0, isGroup: true, memberCount: 15 },
];

const meta: Meta<typeof ConversationList> = {
  title: 'Organisms/ConversationList',
  component: ConversationList,
  decorators: [(Story) => <div style={{ maxWidth: 350, height: 500 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof ConversationList>;

export const Default: Story = {
  args: {
    conversations: DEMO_CONVERSATIONS,
    activeId: '1',
  },
};

export const Empty: Story = {
  args: {
    conversations: [],
  },
};

export const NoActive: Story = {
  args: {
    conversations: DEMO_CONVERSATIONS,
  },
};
