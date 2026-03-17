import type { Meta, StoryObj } from '@storybook/react';
import InlineEditor from './InlineEditor';

const meta: Meta<typeof InlineEditor> = {
  title: 'Atoms/InlineEditor',
  component: InlineEditor,
  decorators: [(Story) => <div style={{ maxWidth: 200, padding: 16 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof InlineEditor>;

export const TextMode: Story = {
  args: {
    value: 'Design PCB layout',
    type: 'text',
    onSave: (v) => console.log('Saved:', v),
  },
};

export const NumberMode: Story = {
  args: {
    value: '42',
    type: 'number',
    onSave: (v) => console.log('Saved:', v),
  },
};

export const EmptyPlaceholder: Story = {
  args: {
    value: '',
    type: 'text',
    placeholder: 'Click to edit',
    onSave: (v) => console.log('Saved:', v),
  },
};
