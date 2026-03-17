import type { Meta, StoryObj } from '@storybook/react';
import HPBar from './HPBar';

const meta: Meta<typeof HPBar> = {
  title: 'Atoms/HPBar',
  component: HPBar,
};
export default meta;

type Story = StoryObj<typeof HPBar>;

export const Full: Story = { args: { value: 92 } };
export const Mid: Story = { args: { value: 50 } };
export const Low: Story = { args: { value: 20 } };
export const Empty: Story = { args: { value: 0 } };
export const CustomMax: Story = { args: { value: 15, max: 20 } };
