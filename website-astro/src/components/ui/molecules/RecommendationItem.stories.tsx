import type { Meta, StoryObj } from '@storybook/react';
import RecommendationItem from './RecommendationItem';

const meta: Meta<typeof RecommendationItem> = {
  title: 'Molecules/RecommendationItem',
  component: RecommendationItem,
  decorators: [(Story) => <div style={{ maxWidth: 400 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof RecommendationItem>;

export const Urgent: Story = {
  args: {
    severity: 'urgent',
    message: 'Soil moisture critically low! Water immediately to prevent wilting.',
  },
};

export const Warning: Story = {
  args: {
    severity: 'warning',
    message: 'Temperature above optimal range. Consider moving to a shadier spot.',
  },
};

export const Info: Story = {
  args: {
    severity: 'info',
    message: 'Your plant has been thriving! Consider repotting in the next few weeks.',
  },
};

export const WithDismiss: Story = {
  args: {
    severity: 'warning',
    message: 'Light levels have been low for 3 consecutive days.',
    onDismiss: () => alert('Dismissed!'),
  },
};
