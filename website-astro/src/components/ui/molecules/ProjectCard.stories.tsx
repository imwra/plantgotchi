import type { Meta, StoryObj } from '@storybook/react';
import ProjectCard from './ProjectCard';

const meta: Meta<typeof ProjectCard> = {
  title: 'Molecules/ProjectCard',
  component: ProjectCard,
  decorators: [(Story) => <div style={{ maxWidth: 320 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof ProjectCard>;

export const Default: Story = {
  args: {
    name: 'Launching Plantgotchi',
    description: 'Hardware + firmware launch tracker',
    issueCount: 24,
    memberAvatars: ['Will', 'Ana'],
    href: '/projects/abc123',
  },
};

export const LongDescription: Story = {
  args: {
    name: 'Website Redesign',
    description: 'Complete overhaul of the Plantgotchi website including new landing page, dashboard improvements, mobile optimization, and accessibility audit.',
    issueCount: 58,
    memberAvatars: ['Alice', 'Bob', 'Carlos'],
    href: '/projects/def456',
  },
};

export const ManyMembers: Story = {
  args: {
    name: 'Community Features',
    description: 'Social features for plant lovers',
    issueCount: 12,
    memberAvatars: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    href: '/projects/ghi789',
  },
};
