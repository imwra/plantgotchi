import type { Meta, StoryObj } from '@storybook/react';
import ChatInput from './ChatInput';

const meta: Meta<typeof ChatInput> = {
  title: 'Atoms/ChatInput',
  component: ChatInput,
};
export default meta;

type Story = StoryObj<typeof ChatInput>;

export const Empty: Story = {
  args: {
    value: '',
    onChange: () => {},
    onSend: () => {},
    onImageClick: () => {},
  },
};

export const WithText: Story = {
  args: {
    value: 'Sua planta está linda!',
    onChange: () => {},
    onSend: () => {},
    onImageClick: () => {},
  },
};

export const Disabled: Story = {
  args: {
    value: '',
    onChange: () => {},
    onSend: () => {},
    onImageClick: () => {},
    disabled: true,
  },
};
