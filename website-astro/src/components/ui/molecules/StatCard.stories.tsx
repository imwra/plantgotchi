import type { Meta, StoryObj } from '@storybook/react';
import StatCard from './StatCard';

const meta: Meta<typeof StatCard> = {
  title: 'Molecules/StatCard',
  component: StatCard,
  decorators: [(Story) => <div style={{ maxWidth: 180 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof StatCard>;

export const TotalUsers: Story = {
  args: { label: 'TOTAL USERS', value: 142, icon: '\uD83D\uDC64', variant: 'primary' },
};

export const TotalPlants: Story = {
  args: { label: 'TOTAL PLANTS', value: 587, icon: '\uD83C\uDF3F', variant: 'primary' },
};

export const ReadingsToday: Story = {
  args: { label: 'READINGS TODAY', value: '1.2K', icon: '\uD83D\uDCCA', variant: 'water' },
};
