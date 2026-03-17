import type { Meta, StoryObj } from '@storybook/react';
import CourseCard from './CourseCard';

const meta: Meta<typeof CourseCard> = {
  title: 'Molecules/CourseCard',
  component: CourseCard,
};
export default meta;

type Story = StoryObj<typeof CourseCard>;

export const Default: Story = {
  args: {
    title: 'Indoor Herb Growing 101',
    slug: 'indoor-herb-101',
    description: 'Learn to grow basil, mint, and cilantro indoors year-round',
    coverImageUrl: null,
    creatorName: 'GreenThumb Sarah',
    priceCents: 0,
    currency: 'USD',
    enrollmentCount: 42,
  },
};

export const PaidCourse: Story = {
  args: {
    title: 'Advanced Succulent Propagation',
    slug: 'advanced-succulents',
    description: 'Master leaf cuttings, offsets, and division techniques for over 30 succulent species',
    coverImageUrl: null,
    creatorName: 'Desert Rose Mike',
    priceCents: 1999,
    currency: 'USD',
    enrollmentCount: 18,
  },
};
