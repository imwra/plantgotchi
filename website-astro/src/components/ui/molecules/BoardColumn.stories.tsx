import type { Meta, StoryObj } from '@storybook/react';
import BoardColumn from './BoardColumn';
import BoardCard from './BoardCard';

const meta: Meta<typeof BoardColumn> = {
  title: 'Molecules/BoardColumn',
  component: BoardColumn,
  decorators: [(Story) => <div style={{ maxWidth: 280 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof BoardColumn>;

export const Default: Story = {
  args: {
    id: 'in_progress',
    label: 'In Progress',
    count: 3,
    color: '#3b82f6',
  },
  render: (args) => (
    <BoardColumn {...args}>
      <BoardCard id="1" title="Design PCB layout" fieldChip={{ label: 'PCB', color: '#8b5cf6' }} assigneeAvatar={{ name: 'Will' }} />
      <BoardCard id="2" title="Implement BLE pairing" fieldChip={{ label: 'Firmware', color: '#3b82f6' }} />
      <BoardCard id="3" title="Test soil sensor readings" assigneeAvatar={{ name: 'Ana' }} />
    </BoardColumn>
  ),
};

export const Empty: Story = {
  args: {
    id: 'blocked',
    label: 'Blocked',
    count: 0,
    color: '#ef4444',
  },
  render: (args) => (
    <BoardColumn {...args}>{null}</BoardColumn>
  ),
};

export const DropTarget: Story = {
  args: {
    id: 'done',
    label: 'Done',
    count: 2,
    color: '#22c55e',
    isDropTarget: true,
  },
  render: (args) => (
    <BoardColumn {...args}>
      <BoardCard id="4" title="Order PCB prototype" fieldChip={{ label: 'PCB', color: '#8b5cf6' }} />
      <BoardCard id="5" title="Set up dev environment" />
    </BoardColumn>
  ),
};
