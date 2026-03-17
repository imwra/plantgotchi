import type { Meta, StoryObj } from '@storybook/react';
import NewConversationModal from './NewConversationModal';

const DEMO_USERS = [
  { id: 'u1', name: 'Maria Silva', emoji: '🌿' },
  { id: 'u2', name: 'João Santos', emoji: '🌵' },
  { id: 'u3', name: 'Ana Costa', emoji: '🌻' },
  { id: 'u4', name: 'Pedro Lima', emoji: '🌴' },
  { id: 'u5', name: 'Clara Oliveira', emoji: '🌺' },
];

const meta: Meta<typeof NewConversationModal> = {
  title: 'Organisms/NewConversationModal',
  component: NewConversationModal,
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof NewConversationModal>;

export const Default: Story = {
  args: {
    onClose: () => {},
    searchResults: DEMO_USERS,
  },
};

export const EmptySearch: Story = {
  args: {
    onClose: () => {},
    searchResults: [],
  },
};
