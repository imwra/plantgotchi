import type { Meta, StoryObj } from '@storybook/react';
import IssueRow from './IssueRow';

const meta: Meta<typeof IssueRow> = {
  title: 'Molecules/IssueRow',
  component: IssueRow,
  decorators: [(Story) => (
    <table className="w-full"><tbody><Story /></tbody></table>
  )],
};
export default meta;

type Story = StoryObj<typeof IssueRow>;

export const Todo: Story = {
  args: {
    id: '1',
    title: 'Create JLCPCB account',
    status: 'todo',
    assignees: ['Will'],
    updatedAt: '2026-03-15',
    visibleFields: [],
  },
};

export const InProgress: Story = {
  args: {
    id: '2',
    title: 'Implement sensor reading',
    status: 'in_progress',
    assignees: ['Will', 'Ana'],
    updatedAt: '2026-03-16',
    visibleFields: [],
  },
};

export const Done: Story = {
  args: {
    id: '3',
    title: 'Design review with spec',
    status: 'done',
    updatedAt: '2026-03-10',
    visibleFields: [],
  },
};

export const Blocked: Story = {
  args: {
    id: '4',
    title: 'Order PCBs from JLCPCB',
    status: 'blocked',
    updatedAt: '2026-03-14',
    visibleFields: [],
  },
};

export const SubIssue: Story = {
  args: {
    id: '5',
    title: 'Add WS2812B LED circuit',
    status: 'in_progress',
    isSubIssue: true,
    assignees: ['Will'],
    updatedAt: '2026-03-16',
    visibleFields: [],
  },
};

export const WithCustomFields: Story = {
  args: {
    id: '6',
    title: 'Route PCB layout',
    status: 'todo',
    customFields: [
      { field_name: 'Phase', value: 'PCB DESIGN' },
      { field_name: 'Priority', value: 'Critical' },
    ],
    visibleFields: ['Phase', 'Priority'],
    updatedAt: '2026-03-15',
  },
};
