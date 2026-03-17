import type { Meta, StoryObj } from '@storybook/react';
import CareLogItem from './CareLogItem';

const meta: Meta<typeof CareLogItem> = {
  title: 'Molecules/CareLogItem',
  component: CareLogItem,
  decorators: [(Story) => <div style={{ maxWidth: 360 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof CareLogItem>;

export const Watered: Story = {
  args: { action: 'water', date: '2026-03-15T10:30:00Z' },
};

export const Fertilized: Story = {
  args: { action: 'fertilize', date: '2026-03-14T09:00:00Z' },
};

export const WithNotes: Story = {
  args: { action: 'water', notes: 'Used filtered water, 200ml', date: '2026-03-13T14:00:00Z' },
};

export const PestTreatment: Story = {
  args: { action: 'pest_treatment', notes: 'Neem oil spray for aphids', date: '2026-03-10T11:00:00Z' },
};
