import type { Meta, StoryObj } from '@storybook/react';
import SiteNav from './SiteNav';

const meta: Meta<typeof SiteNav> = {
  title: 'Organisms/SiteNav',
  component: SiteNav,
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof SiteNav>;

export const LoggedIn: Story = {
  args: {
    userName: 'Willa',
    locale: 'pt-br',
    currentPath: '/garden',
    isCreator: false,
  },
};

export const LoggedInCreator: Story = {
  args: {
    userName: 'Willa',
    locale: 'pt-br',
    currentPath: '/garden',
    isCreator: true,
  },
};

export const LoggedOut: Story = {
  args: {
    locale: 'pt-br',
    currentPath: '/',
  },
};
