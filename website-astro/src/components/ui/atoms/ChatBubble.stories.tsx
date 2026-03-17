import type { Meta, StoryObj } from '@storybook/react';
import ChatBubble from './ChatBubble';

const meta: Meta<typeof ChatBubble> = {
  title: 'Atoms/ChatBubble',
  component: ChatBubble,
};
export default meta;

type Story = StoryObj<typeof ChatBubble>;

export const MyMessage: Story = {
  args: {
    content: 'Obrigado! Ela está com 3 anos já',
    type: 'text',
    isMine: true,
    timestamp: '14:32',
    senderName: 'Você',
  },
};

export const TheirMessage: Story = {
  args: {
    content: 'Oi! Vi sua jiboia no perfil, que linda!',
    type: 'text',
    isMine: false,
    timestamp: '14:30',
    senderName: 'Maria Silva',
  },
};

export const ImageMessage: Story = {
  args: {
    content: 'https://placeholder.plantgotchi.dev/chat/jiboia.jpg',
    type: 'image',
    isMine: true,
    timestamp: '14:36',
    senderName: 'Você',
  },
};

export const LongMessage: Story = {
  args: {
    content: 'Rego toda segunda e quinta, e deixo perto da janela. Também uso adubo orgânico uma vez por mês e faço poda a cada dois meses para manter ela bem saudável.',
    type: 'text',
    isMine: false,
    timestamp: '14:35',
    senderName: 'Maria Silva',
  },
};
