import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import AddPlantModal from './AddPlantModal';

const meta: Meta<typeof AddPlantModal> = {
  title: 'Organisms/AddPlantModal',
  component: AddPlantModal,
  parameters: {
    layout: 'fullscreen',
    mockData: [
      {
        url: '/api/plants',
        method: 'POST',
        status: 200,
        response: { id: 'new-1', name: 'Test Plant' },
      },
    ],
  },
};
export default meta;

type Story = StoryObj<typeof AddPlantModal>;

export const Default: Story = {
  args: {
    onClose: action('onClose'),
    onCreated: action('onCreated'),
  },
};
