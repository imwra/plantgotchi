import type { Meta, StoryObj } from '@storybook/react';
import Badge from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Success: Story = { args: { label: 'Active', variant: 'success' } };
export const Warning: Story = { args: { label: 'Pending', variant: 'warning' } };
export const Danger: Story = { args: { label: 'Offline', variant: 'danger' } };
export const Info: Story = { args: { label: 'Connected', variant: 'info' } };
export const Neutral: Story = { args: { label: 'Unknown', variant: 'neutral' } };

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge label="Active" variant="success" />
      <Badge label="Pending" variant="warning" />
      <Badge label="Offline" variant="danger" />
      <Badge label="Connected" variant="info" />
      <Badge label="Unknown" variant="neutral" />
    </div>
  ),
};
