import type { Meta, StoryObj } from '@storybook/react';
import AdminPanel from './AdminPanel';

const meta: Meta<typeof AdminPanel> = {
  title: 'Organisms/AdminPanel',
  component: AdminPanel,
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof AdminPanel>;

export const Default: Story = {
  args: {
    userName: 'Admin',
  },
};
