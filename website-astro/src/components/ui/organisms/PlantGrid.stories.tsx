import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import PlantGrid from './PlantGrid';

const meta: Meta<typeof PlantGrid> = {
  title: 'Organisms/PlantGrid',
  component: PlantGrid,
};
export default meta;

type Story = StoryObj<typeof PlantGrid>;

const demoPlants = [
  { id: '1', name: 'Jiboia', species: 'Epipremnum aureum', emoji: '\uD83C\uDF3F', status: 'happy' as const, hp: 92, moisture: 68, temp: 24.5, lightLabel: 'medium', lastWatered: '2026-03-14T10:00:00Z' },
  { id: '2', name: 'Suculenta', species: 'Echeveria elegans', emoji: '\uD83E\uDEB4', status: 'stressed' as const, hp: 58, moisture: 31, temp: 26.1, lightLabel: 'high', lastWatered: '2026-03-10T08:00:00Z' },
  { id: '3', name: 'Samambaia', species: 'Nephrolepis exaltata', emoji: '\uD83C\uDF31', status: 'happy' as const, hp: 85, moisture: 85, temp: 22.3, lightLabel: 'low', lastWatered: '2026-03-15T07:00:00Z' },
  { id: '4', name: 'Espada-de-Sao-Jorge', species: 'Dracaena trifasciata', emoji: '\uD83D\uDDE1\uFE0F', status: 'unknown' as const, hp: 50, moisture: null, temp: null, lightLabel: 'unknown' },
  { id: '5', name: 'Monstera', species: 'Monstera deliciosa', emoji: '\uD83C\uDF3F', status: 'happy' as const, hp: 78, moisture: 55, temp: 23.8, lightLabel: 'medium', lastWatered: '2026-03-13T09:00:00Z' },
  { id: '6', name: 'Cacto', species: 'Cereus jamacaru', emoji: '\uD83C\uDF35', status: 'unknown' as const, hp: 50, moisture: null, temp: null, lightLabel: 'unknown' },
];

export const Default: Story = {
  args: {
    plants: demoPlants,
    onSelect: action('onSelect'),
  },
};

export const Empty: Story = {
  args: {
    plants: [],
  },
};

export const WithSelection: Story = {
  args: {
    plants: demoPlants,
    selectedId: '1',
    onSelect: action('onSelect'),
  },
};
