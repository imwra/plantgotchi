import type { Meta, StoryObj } from '@storybook/react';
import StatusBadge from './StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'Atoms/StatusBadge',
  component: StatusBadge,
};
export default meta;

type Story = StoryObj<typeof StatusBadge>;

export const Happy: Story = { args: { status: 'happy' } };
export const Thirsty: Story = { args: { status: 'thirsty' } };
export const Unknown: Story = { args: { status: 'unknown' } };
export const CustomLabels: Story = {
  args: { status: 'happy', labels: { happy: 'FELIZ', thirsty: 'COM SEDE!', unknown: 'MANUAL' } },
};
