import type { Meta, StoryObj } from '@storybook/react';
import FieldEditor from './FieldEditor';

const meta: Meta<typeof FieldEditor> = {
  title: 'Molecules/FieldEditor',
  component: FieldEditor,
  decorators: [(Story) => <div style={{ maxWidth: 300 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof FieldEditor>;

export const Text: Story = {
  args: {
    field: { id: '1', name: 'Notes', field_type: 'text', options: '[]' },
    value: 'Some text value',
  },
};

export const Number: Story = {
  args: {
    field: { id: '2', name: 'Estimated Hours', field_type: 'number', options: '[]' },
    value: '42',
  },
};

export const Date: Story = {
  args: {
    field: { id: '3', name: 'Due Date', field_type: 'date', options: '[]' },
    value: '2026-04-01',
  },
};

export const SingleSelect: Story = {
  args: {
    field: { id: '4', name: 'Priority', field_type: 'single_select', options: '["Critical","High","Normal","Low"]' },
    value: 'High',
  },
};

export const MultiSelect: Story = {
  args: {
    field: { id: '5', name: 'Labels', field_type: 'multi_select', options: '["hardware","firmware","design","testing"]' },
    value: 'hardware, testing',
  },
};

export const User: Story = {
  args: {
    field: { id: '6', name: 'Reviewer', field_type: 'user', options: '[]' },
    value: '',
  },
};
