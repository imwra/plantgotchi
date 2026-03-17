import type { Meta, StoryObj } from '@storybook/react';
import CoursePriceBadge from './CoursePriceBadge';

const meta: Meta<typeof CoursePriceBadge> = {
  title: 'Atoms/CoursePriceBadge',
  component: CoursePriceBadge,
};
export default meta;

type Story = StoryObj<typeof CoursePriceBadge>;

export const Free: Story = { args: { priceCents: 0 } };
export const Paid: Story = { args: { priceCents: 999, currency: 'USD' } };
export const Expensive: Story = { args: { priceCents: 9999, currency: 'USD' } };
