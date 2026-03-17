import type { Meta, StoryObj } from '@storybook/react';
import CareHistory from './CareHistory';

const meta: Meta<typeof CareHistory> = {
  title: 'Molecules/CareHistory',
  component: CareHistory,
  decorators: [(Story) => <div style={{ maxWidth: 360 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof CareHistory>;

export const WithLogs: Story = {
  args: {
    logs: [
      { action: 'water', created_at: '2026-03-15T10:30:00Z' },
      { action: 'fertilize', notes: 'NPK 10-10-10 diluted', created_at: '2026-03-13T09:00:00Z' },
      { action: 'prune', notes: 'Removed yellow leaves', created_at: '2026-03-10T14:00:00Z' },
      { action: 'mist', created_at: '2026-03-08T08:00:00Z' },
      { action: 'pest_treatment', notes: 'Neem oil spray', created_at: '2026-03-05T11:00:00Z' },
    ],
  },
};

export const Empty: Story = {
  args: { logs: [] },
};
