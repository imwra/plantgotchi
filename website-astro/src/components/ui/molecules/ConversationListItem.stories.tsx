import type { Meta, StoryObj } from '@storybook/react';
import ConversationListItem from './ConversationListItem';

const meta: Meta<typeof ConversationListItem> = {
  title: 'Molecules/ConversationListItem',
  component: ConversationListItem,
  decorators: [(Story) => <div style={{ maxWidth: 350 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof ConversationListItem>;

export const DirectMessage: Story = {
  args: {
    name: 'Maria Silva',
    lastMessage: 'Sua jiboia está linda!',
    lastMessageTime: '2m',
    unreadCount: 3,
    isGroup: false,
    memberCount: 2,
  },
};

export const GroupChat: Story = {
  args: {
    name: 'Grupo: Suculentas SP',
    lastMessage: 'Alguém tem mudas de echeveria?',
    lastMessageTime: '1h',
    unreadCount: 0,
    isGroup: true,
    memberCount: 8,
  },
};

export const Active: Story = {
  args: {
    name: 'João Santos',
    lastMessage: 'Valeu pela dica!',
    lastMessageTime: '3h',
    unreadCount: 1,
    isGroup: false,
    isActive: true,
  },
};

export const NoUnread: Story = {
  args: {
    name: 'Grupo: Iniciantes',
    lastMessage: 'Como regar cactos?',
    lastMessageTime: '1d',
    unreadCount: 0,
    isGroup: true,
    memberCount: 15,
  },
};
