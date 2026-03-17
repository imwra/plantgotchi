import type { Meta, StoryObj } from '@storybook/react';
import PlantCard from './PlantCard';

const meta: Meta<typeof PlantCard> = {
  title: 'Molecules/PlantCard',
  component: PlantCard,
  decorators: [(Story) => <div style={{ maxWidth: 320 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof PlantCard>;

export const HappyPlant: Story = {
  args: {
    name: 'Jiboia',
    species: 'Epipremnum aureum',
    emoji: '\uD83C\uDF3F',
    status: 'happy',
    hp: 92,
    moisture: 68,
    temp: 24.5,
    lightLabel: 'medium',
    lastWatered: '2026-03-14T10:00:00Z',
  },
};

export const ThirstyPlant: Story = {
  args: {
    name: 'Suculenta',
    species: 'Echeveria elegans',
    emoji: '\uD83E\uDEB4',
    status: 'thirsty',
    hp: 58,
    moisture: 32,
    temp: 26.1,
    lightLabel: 'high',
    lastWatered: '2026-03-10T08:00:00Z',
  },
};

export const NoSensor: Story = {
  args: {
    name: 'Espada-de-Sao-Jorge',
    species: 'Dracaena trifasciata',
    emoji: '\uD83D\uDDE1\uFE0F',
    status: 'unknown',
    hp: 75,
    moisture: null,
    temp: null,
    lightLabel: 'unknown',
  },
};

export const Selected: Story = {
  args: {
    ...HappyPlant.args,
    isSelected: true,
  },
};
