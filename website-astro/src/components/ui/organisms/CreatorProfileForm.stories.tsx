import type { Meta, StoryObj } from '@storybook/react';
import CreatorProfileForm from './CreatorProfileForm';

const meta: Meta<typeof CreatorProfileForm> = {
  title: 'Organisms/CreatorProfileForm',
  component: CreatorProfileForm,
};
export default meta;

type Story = StoryObj<typeof CreatorProfileForm>;

export const CreateMode: Story = {
  args: { mode: 'create' },
};

export const EditMode: Story = {
  args: { mode: 'edit' },
};
