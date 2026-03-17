import type { Meta, StoryObj } from '@storybook/react';
import PixelButton from './PixelButton';

const meta: Meta<typeof PixelButton> = {
  title: 'Atoms/PixelButton',
  component: PixelButton,
};
export default meta;

type Story = StoryObj<typeof PixelButton>;

export const Water: Story = { args: { label: '\uD83D\uDCA7 WATER', variant: 'water' } };
export const Primary: Story = { args: { label: '\uD83D\uDCDD LOG', variant: 'primary' } };
export const Neutral: Story = { args: { label: '\u2699 EDIT', variant: 'neutral' } };
export const Disabled: Story = { args: { label: '\uD83D\uDCA7 WATER', variant: 'water', disabled: true } };
