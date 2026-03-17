import type { Meta, StoryObj } from '@storybook/react';
import TaskRow from './TaskRow';

const meta: Meta<typeof TaskRow> = {
  title: 'Molecules/TaskRow',
  component: TaskRow,
  decorators: [(Story) => <div style={{ maxWidth: 500 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof TaskRow>;

export const Todo: Story = {
  args: { title: 'Set up PlatformIO project', status: 'todo' },
};

export const InProgress: Story = {
  args: { title: 'Implement MQTT client', status: 'in_progress' },
};

export const Done: Story = {
  args: { title: 'Design review with spec', status: 'done' },
};

export const Blocked: Story = {
  args: { title: 'Flash firmware on prototype', status: 'blocked' },
};

export const Critical: Story = {
  args: { title: 'Route PCB (2-layer FR4)', status: 'todo', critical: true },
};

export const WithNotes: Story = {
  args: { title: 'Implement sensor reading', status: 'in_progress', notes: 'Waiting for calibration data' },
};
