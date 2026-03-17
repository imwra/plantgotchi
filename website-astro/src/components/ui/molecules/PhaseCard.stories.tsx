import type { Meta, StoryObj } from '@storybook/react';
import PhaseCard from './PhaseCard';

const meta: Meta<typeof PhaseCard> = {
  title: 'Molecules/PhaseCard',
  component: PhaseCard,
  decorators: [(Story) => <div style={{ maxWidth: 600 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof PhaseCard>;

const sampleTasks = [
  { id: 't1', title: 'Set up PlatformIO project', status: 'done', critical: true },
  { id: 't2', title: 'Implement AP provisioning', status: 'done', critical: true },
  { id: 't3', title: 'Implement sensor reading', status: 'in_progress', critical: true },
  { id: 't4', title: 'Implement MQTT client', status: 'todo', critical: true },
  { id: 't5', title: 'Implement LED state machine', status: 'todo' },
];

export const Expanded: Story = {
  args: {
    name: 'ESP32 FIRMWARE',
    number: 3,
    tasks: sampleTasks,
    collapsed: false,
  },
};

export const Collapsed: Story = {
  args: {
    name: 'ESP32 FIRMWARE',
    number: 3,
    tasks: sampleTasks,
    collapsed: true,
  },
};

export const AllDone: Story = {
  args: {
    name: 'SETUP',
    number: 0,
    tasks: [
      { id: 't1', title: 'Create JLCPCB account', status: 'done' },
      { id: 't2', title: 'Create AliExpress account', status: 'done' },
      { id: 't3', title: 'Install KiCad 8+', status: 'done' },
    ],
    collapsed: false,
  },
};
