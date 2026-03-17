import type { Meta, StoryObj } from '@storybook/react';
import TypingDots from './TypingDots';

const meta: Meta<typeof TypingDots> = {
  title: 'Atoms/TypingDots',
  component: TypingDots,
};
export default meta;

type Story = StoryObj<typeof TypingDots>;

export const Default: Story = {};
