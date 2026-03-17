import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import CareLogForm from './CareLogForm';

const meta: Meta<typeof CareLogForm> = {
  title: 'Organisms/CareLogForm',
  component: CareLogForm,
  decorators: [(Story) => <div style={{ maxWidth: 320 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof CareLogForm>;

export const Default: Story = {
  args: {
    plantId: 'demo-1',
    onLogged: action('onLogged'),
  },
};
