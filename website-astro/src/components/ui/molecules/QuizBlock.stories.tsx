import type { Meta, StoryObj } from '@storybook/react';
import QuizBlock from './QuizBlock';

const meta: Meta<typeof QuizBlock> = {
  title: 'Molecules/QuizBlock',
  component: QuizBlock,
};
export default meta;

type Story = StoryObj<typeof QuizBlock>;

export const Default: Story = {
  args: {
    question: 'How often should you water succulents during the growing season?',
    options: [
      'Every day',
      'Every 2-3 days',
      'Once a week when the soil is completely dry',
      'Once a month',
    ],
    correctIndex: 2,
    explanation: 'Succulents store water in their leaves and prefer the soak-and-dry method. Overwatering is the most common cause of succulent death.',
    onAnswer: () => {},
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};
