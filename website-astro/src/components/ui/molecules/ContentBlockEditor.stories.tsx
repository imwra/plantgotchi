import type { Meta, StoryObj } from '@storybook/react';
import ContentBlockEditor from './ContentBlockEditor';

const meta: Meta<typeof ContentBlockEditor> = {
  title: 'Molecules/ContentBlockEditor',
  component: ContentBlockEditor,
};
export default meta;

type Story = StoryObj<typeof ContentBlockEditor>;

export const TextEditor: Story = {
  args: {
    blockType: 'text',
    content: JSON.stringify({ markdown: '## Propagation Methods\n\nThere are three primary ways to propagate succulents:\n\n1. **Leaf cuttings** - gently twist a healthy leaf from the stem\n2. **Stem cuttings** - cut a section of stem with a clean blade\n3. **Offsets** - separate pups that grow at the base of the parent plant' }),
    onChange: () => {},
    onDelete: () => {},
  },
};

export const VideoEditor: Story = {
  args: {
    blockType: 'video',
    content: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', caption: 'Step-by-step guide to leaf propagation' }),
    onChange: () => {},
    onDelete: () => {},
  },
};

export const QuizEditor: Story = {
  args: {
    blockType: 'quiz',
    content: JSON.stringify({
      question: 'What is the best time to water indoor plants?',
      options: ['Late at night', 'Early morning', 'Midday when it is hottest', 'It does not matter'],
      correct_index: 1,
      explanation: 'Morning watering allows leaves to dry during the day, reducing the risk of fungal diseases.',
    }),
    onChange: () => {},
    onDelete: () => {},
  },
};
