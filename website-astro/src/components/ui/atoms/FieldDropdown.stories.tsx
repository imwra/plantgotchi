import type { Meta, StoryObj } from '@storybook/react';
import FieldDropdown from './FieldDropdown';

const meta: Meta<typeof FieldDropdown> = {
  title: 'Atoms/FieldDropdown',
  component: FieldDropdown,
  decorators: [(Story) => <div style={{ maxWidth: 200, padding: 16 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof FieldDropdown>;

const sampleOptions = [
  { value: 'pcb', label: 'PCB Design', color: '#8b5cf6' },
  { value: 'firmware', label: 'Firmware', color: '#3b82f6' },
  { value: 'case', label: '3D Case', color: '#22c55e' },
  { value: 'setup', label: 'Setup', color: '#f59e0b' },
];

export const SingleSelect: Story = {
  args: {
    options: sampleOptions,
    value: 'firmware',
    onChange: (v) => console.log('Changed:', v),
  },
};

export const MultiSelect: Story = {
  args: {
    options: sampleOptions,
    value: ['pcb', 'firmware'],
    multi: true,
    onChange: (v) => console.log('Changed:', v),
  },
};

export const Empty: Story = {
  args: {
    options: sampleOptions,
    value: '',
    placeholder: 'Select phase...',
    onChange: (v) => console.log('Changed:', v),
  },
};
