import type { Meta, StoryObj } from '@storybook/react';
import UserPicker from './UserPicker';

const sampleUsers = [
  { id: 'u1', name: 'Will' },
  { id: 'u2', name: 'Ana' },
  { id: 'u3', name: 'Carlos' },
  { id: 'u4', name: 'Maria' },
  { id: 'u5', name: 'Pedro' },
];

const meta: Meta<typeof UserPicker> = {
  title: 'Atoms/UserPicker',
  component: UserPicker,
  decorators: [(Story) => <div style={{ maxWidth: 200, padding: 16 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof UserPicker>;

export const WithUsers: Story = {
  args: {
    users: sampleUsers,
    value: null,
    onChange: (v) => console.log('Changed:', v),
  },
};

export const Selected: Story = {
  args: {
    users: sampleUsers,
    value: 'u1',
    onChange: (v) => console.log('Changed:', v),
  },
};

export const Empty: Story = {
  args: {
    users: sampleUsers,
    value: null,
    placeholder: 'Assign...',
    onChange: (v) => console.log('Changed:', v),
  },
};
