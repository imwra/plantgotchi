import type { Meta, StoryObj } from '@storybook/react';
import PhaseAccordion from './PhaseAccordion';

const meta: Meta<typeof PhaseAccordion> = {
  title: 'Molecules/PhaseAccordion',
  component: PhaseAccordion,
};
export default meta;

type Story = StoryObj<typeof PhaseAccordion>;

export const Default: Story = {
  args: {
    title: 'Phase 1: Soil & Potting Basics',
    description: 'Learn the foundations of healthy soil composition',
    defaultOpen: true,
    modules: [
      { id: 'm1', title: 'Choosing the Right Soil Mix', is_preview: 1, completed: true },
      { id: 'm2', title: 'Drainage and Container Selection', is_preview: 0, completed: true },
      { id: 'm3', title: 'pH Levels and Nutrient Balance', is_preview: 0, completed: false },
    ],
    onModuleClick: () => {},
  },
};
