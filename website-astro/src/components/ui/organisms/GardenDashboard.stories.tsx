import type { Meta, StoryObj } from '@storybook/react';
import GardenDashboard from './GardenDashboard';

const meta: Meta<typeof GardenDashboard> = {
  title: 'Organisms/GardenDashboard',
  component: GardenDashboard,
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof GardenDashboard>;

export const Default: Story = {
  args: {
    demoMode: true,
    demoBannerText: 'Demo Mode \u2014 data is not saved',
    locale: 'pt-br',
  },
};

export const Empty: Story = {
  render: () => {
    // Override getDemoPlants to return empty
    return (
      <GardenDashboard
        demoMode={false}
        locale="pt-br"
      />
    );
  },
};
