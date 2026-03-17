import type { Meta, StoryObj } from '@storybook/react';
import ContentBlockIcon from './ContentBlockIcon';

const meta: Meta<typeof ContentBlockIcon> = {
  title: 'Atoms/ContentBlockIcon',
  component: ContentBlockIcon,
};
export default meta;

type Story = StoryObj<typeof ContentBlockIcon>;

export const Video: Story = { args: { type: 'video' } };
export const Text: Story = { args: { type: 'text' } };
export const Quiz: Story = { args: { type: 'quiz' } };
