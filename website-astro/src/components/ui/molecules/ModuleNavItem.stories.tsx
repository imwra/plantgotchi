import type { Meta, StoryObj } from '@storybook/react';
import ModuleNavItem from './ModuleNavItem';

const meta: Meta<typeof ModuleNavItem> = {
  title: 'Molecules/ModuleNavItem',
  component: ModuleNavItem,
};
export default meta;

type Story = StoryObj<typeof ModuleNavItem>;

export const Active: Story = {
  args: {
    title: 'Watering Techniques for Tropical Plants',
    completed: false,
    active: true,
    onClick: () => {},
  },
};

export const Completed: Story = {
  args: {
    title: 'Understanding Light Requirements',
    completed: true,
    active: false,
    onClick: () => {},
  },
};

export const Inactive: Story = {
  args: {
    title: 'Fertilizer Schedules and Ratios',
    completed: false,
    active: false,
    onClick: () => {},
  },
};
