import type { Meta, StoryObj } from '@storybook/react';
import ProgressBar from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'Atoms/ProgressBar',
  component: ProgressBar,
};
export default meta;

type Story = StoryObj<typeof ProgressBar>;

export const Full: Story = { args: { value: 100, max: 100 } };
export const Half: Story = { args: { value: 50, max: 100 } };
export const Low: Story = { args: { value: 10, max: 100 } };
export const DangerVariant: Story = { args: { value: 30, max: 100, variant: 'danger' } };
