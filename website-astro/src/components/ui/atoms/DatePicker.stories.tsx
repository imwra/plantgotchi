import type { Meta, StoryObj } from '@storybook/react';
import DatePicker from './DatePicker';

const meta: Meta<typeof DatePicker> = {
  title: 'Atoms/DatePicker',
  component: DatePicker,
  decorators: [(Story) => <div style={{ maxWidth: 200, padding: 16 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof DatePicker>;

export const WithValue: Story = {
  args: {
    value: '2026-03-15',
    onChange: (v) => console.log('Changed:', v),
  },
};

export const Empty: Story = {
  args: {
    value: '',
    placeholder: 'Pick date',
    onChange: (v) => console.log('Changed:', v),
  },
};
