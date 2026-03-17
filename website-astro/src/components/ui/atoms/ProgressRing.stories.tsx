import type { Meta, StoryObj } from '@storybook/react';
import ProgressRing from './ProgressRing';

const meta: Meta<typeof ProgressRing> = {
  title: 'Atoms/ProgressRing',
  component: ProgressRing,
};
export default meta;

type Story = StoryObj<typeof ProgressRing>;

export const Empty: Story = { args: { percent: 0 } };
export const OneThird: Story = { args: { percent: 33 } };
export const TwoThirds: Story = { args: { percent: 66 } };
export const Complete: Story = { args: { percent: 100 } };
