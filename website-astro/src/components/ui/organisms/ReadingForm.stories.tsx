import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import ReadingForm from './ReadingForm';

const meta: Meta<typeof ReadingForm> = {
  title: 'Organisms/ReadingForm',
  component: ReadingForm,
  decorators: [(Story) => <div style={{ maxWidth: 320 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof ReadingForm>;

export const Default: Story = {
  args: {
    plantId: 'demo-1',
    onSubmitted: action('onSubmitted'),
  },
};
