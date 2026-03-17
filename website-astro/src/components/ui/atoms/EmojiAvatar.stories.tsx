import type { Meta, StoryObj } from '@storybook/react';
import EmojiAvatar from './EmojiAvatar';

const meta: Meta<typeof EmojiAvatar> = {
  title: 'Atoms/EmojiAvatar',
  component: EmojiAvatar,
};
export default meta;

type Story = StoryObj<typeof EmojiAvatar>;

export const Happy: Story = { args: { emoji: '\uD83C\uDF3F', status: 'happy' } };
export const Thirsty: Story = { args: { emoji: '\uD83E\uDEB4', status: 'thirsty' } };
export const Idle: Story = { args: { emoji: '\uD83C\uDF35', status: 'idle' } };
export const LargeHappy: Story = { args: { emoji: '\uD83C\uDF3F', status: 'happy', size: 'lg' } };
