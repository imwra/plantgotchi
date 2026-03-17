import type { Meta, StoryObj } from '@storybook/react';
import CompletionCheck from './CompletionCheck';

const meta: Meta<typeof CompletionCheck> = {
  title: 'Atoms/CompletionCheck',
  component: CompletionCheck,
};
export default meta;

type Story = StoryObj<typeof CompletionCheck>;

export const Completed: Story = { args: { completed: true } };
export const Incomplete: Story = { args: { completed: false } };
