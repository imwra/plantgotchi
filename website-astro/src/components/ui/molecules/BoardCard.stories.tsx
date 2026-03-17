import type { Meta, StoryObj } from '@storybook/react';
import BoardCard from './BoardCard';

const meta: Meta<typeof BoardCard> = {
  title: 'Molecules/BoardCard',
  component: BoardCard,
  decorators: [(Story) => <div style={{ maxWidth: 250 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof BoardCard>;

export const Default: Story = {
  args: {
    id: '1',
    title: 'Design PCB layout for soil moisture sensor',
    fieldChip: { label: 'PCB Design', color: '#8b5cf6' },
    assigneeAvatar: { name: 'Will' },
  },
};

export const Dragging: Story = {
  args: {
    id: '2',
    title: 'Implement BLE pairing flow',
    fieldChip: { label: 'Firmware', color: '#3b82f6' },
    isDragging: true,
  },
};

export const LongTitle: Story = {
  args: {
    id: '3',
    title: 'Research and evaluate different waterproofing methods for the outdoor sensor enclosure including conformal coating and potting compounds',
    fieldChip: { label: '3D Case', color: '#22c55e' },
    assigneeAvatar: { name: 'Ana' },
    priority: { label: 'High', color: '#f59e0b' },
  },
};

export const Minimal: Story = {
  args: {
    id: '4',
    title: 'Update documentation',
  },
};
