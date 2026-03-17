import type { Meta, StoryObj } from '@storybook/react';
import ReactionPicker from './ReactionPicker';

const meta: Meta<typeof ReactionPicker> = {
  title: 'Molecules/ReactionPicker',
  component: ReactionPicker,
};
export default meta;

type Story = StoryObj<typeof ReactionPicker>;

export const Default: Story = {
  args: {
    onSelect: () => {},
    onClose: () => {},
  },
};
