import type { Meta, StoryObj } from '@storybook/react';
import MoistureBar from './MoistureBar';

const meta: Meta<typeof MoistureBar> = {
  title: 'Atoms/MoistureBar',
  component: MoistureBar,
};
export default meta;

type Story = StoryObj<typeof MoistureBar>;

export const High: Story = { args: { value: 85 } };
export const Mid: Story = { args: { value: 55 } };
export const Low: Story = { args: { value: 25 } };
export const NoSensor: Story = { args: { value: null } };
