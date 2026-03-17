import type { Meta, StoryObj } from '@storybook/react';
import MiniChart from './MiniChart';

const meta: Meta<typeof MiniChart> = {
  title: 'Atoms/MiniChart',
  component: MiniChart,
};
export default meta;

type Story = StoryObj<typeof MiniChart>;

export const Rising: Story = { args: { data: [45, 52, 60, 68, 72, 70, 68] } };
export const Falling: Story = { args: { data: [80, 72, 60, 50, 42, 36, 32] } };
export const Flat: Story = { args: { data: [50, 50, 50, 50] } };
export const SinglePoint: Story = { args: { data: [42] } };
export const Empty: Story = { args: { data: [] } };
export const Large: Story = { args: { data: [45, 52, 60, 68, 72, 70, 68], width: 220, height: 44 } };
