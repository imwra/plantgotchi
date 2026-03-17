import type { Meta, StoryObj } from '@storybook/react';
import UnreadBadge from './UnreadBadge';

const meta: Meta<typeof UnreadBadge> = {
  title: 'Atoms/UnreadBadge',
  component: UnreadBadge,
};
export default meta;

type Story = StoryObj<typeof UnreadBadge>;

export const Single: Story = { args: { count: 1 } };
export const Multiple: Story = { args: { count: 5 } };
export const Many: Story = { args: { count: 42 } };
export const Max: Story = { args: { count: 150 } };
export const Zero: Story = { args: { count: 0 } };
