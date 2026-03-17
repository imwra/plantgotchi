import type { Meta, StoryObj } from '@storybook/react';
import GroupHeader from './GroupHeader';

const meta: Meta<typeof GroupHeader> = {
  title: 'Molecules/GroupHeader',
  component: GroupHeader,
  decorators: [(Story) => (
    <table className="w-full"><tbody><Story /></tbody></table>
  )],
};
export default meta;

type Story = StoryObj<typeof GroupHeader>;

export const Expanded: Story = {
  args: {
    label: 'PCB DESIGN',
    count: 8,
    doneCount: 1,
    collapsed: false,
    colSpan: 5,
  },
};

export const Collapsed: Story = {
  args: {
    label: 'SETUP',
    count: 6,
    doneCount: 0,
    collapsed: true,
    colSpan: 5,
  },
};

export const FullProgress: Story = {
  args: {
    label: 'COMPLETED PHASE',
    count: 4,
    doneCount: 4,
    collapsed: false,
    colSpan: 5,
  },
};

export const HalfProgress: Story = {
  args: {
    label: 'ESP32 FIRMWARE',
    count: 6,
    doneCount: 3,
    collapsed: false,
    colSpan: 5,
  },
};
