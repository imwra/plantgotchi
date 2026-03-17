import type { Meta, StoryObj } from '@storybook/react';
import SummaryTag from './SummaryTag';

const meta: Meta<typeof SummaryTag> = {
  title: 'Atoms/SummaryTag',
  component: SummaryTag,
};
export default meta;

type Story = StoryObj<typeof SummaryTag>;

export const Plants: Story = { args: { label: '6 PLANTS', icon: '\uD83C\uDF3F', variant: 'primary' } };
export const Happy: Story = { args: { label: '3 HAPPY', icon: '\u2665', variant: 'primary' } };
export const Sensors: Story = { args: { label: '4 SENSORS', icon: '\uD83D\uDCE1', variant: 'water' } };
export const NeedWater: Story = { args: { label: '1 NEED WATER', icon: '\u26A0\uFE0F', variant: 'danger', pulse: true } };
