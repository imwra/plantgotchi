import type { Meta, StoryObj } from '@storybook/react';
import StatBox from './StatBox';

const meta: Meta<typeof StatBox> = {
  title: 'Atoms/StatBox',
  component: StatBox,
};
export default meta;

type Story = StoryObj<typeof StatBox>;

export const Moisture: Story = { args: { icon: '\uD83D\uDCA7', label: 'MOISTURE', value: '68%', variant: 'water' } };
export const Temperature: Story = { args: { icon: '\uD83C\uDF21', label: 'TEMP', value: '24.5\u00B0C', variant: 'sun' } };
export const Light: Story = { args: { icon: '\u2600\uFE0F', label: 'LIGHT', value: 'MEDIUM', variant: 'sun' } };
export const Health: Story = { args: { icon: '\u2665', label: 'HEALTH', value: '92/100', variant: 'primary' } };
