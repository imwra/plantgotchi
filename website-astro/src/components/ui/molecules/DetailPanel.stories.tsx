import type { Meta, StoryObj } from '@storybook/react';
import DetailPanel from './DetailPanel';

const meta: Meta<typeof DetailPanel> = {
  title: 'Molecules/DetailPanel',
  component: DetailPanel,
  decorators: [(Story) => <div style={{ maxWidth: 400 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof DetailPanel>;

export const WithPlant: Story = {
  args: {
    plant: {
      name: 'Jiboia',
      species: 'Epipremnum aureum',
      emoji: '\uD83C\uDF3F',
      status: 'happy',
      hp: 92,
      moisture: 68,
      temp: 24.5,
      lightLabel: 'medium',
    },
  },
};

export const StressedPlant: Story = {
  args: {
    plant: {
      name: 'Suculenta',
      species: 'Echeveria elegans',
      emoji: '\uD83E\uDEB4',
      status: 'stressed',
      hp: 58,
      moisture: 32,
      temp: 26.1,
      lightLabel: 'high',
    },
  },
};

export const EmptyState: Story = {
  args: {},
};

export const WithCloseButton: Story = {
  args: {
    ...WithPlant.args,
    onClose: () => alert('Close clicked'),
  },
};
