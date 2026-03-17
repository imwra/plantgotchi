import type { Meta, StoryObj } from '@storybook/react';
import IssueSidebar from './IssueSidebar';

const meta: Meta<typeof IssueSidebar> = {
  title: 'Molecules/IssueSidebar',
  component: IssueSidebar,
  decorators: [(Story) => <div style={{ maxWidth: 300 }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof IssueSidebar>;

export const FullSidebar: Story = {
  args: {
    issue: {
      id: 'abc123',
      status: 'in_progress',
      parent_issue_id: null,
      assignees: [
        { user_id: 'u1', user_name: 'Will Araujo', user_email: 'will@example.com' },
        { user_id: 'u2', user_name: 'Ana Silva', user_email: 'ana@example.com' },
      ],
      projects: [
        { id: 'p1', name: 'Launching Plantgotchi' },
      ],
    },
    customFields: [
      {
        field: { id: 'f1', name: 'Phase', field_type: 'single_select', options: '["SETUP","PCB DESIGN","3D CASE DESIGN","ESP32 FIRMWARE"]' },
        value: 'PCB DESIGN',
      },
      {
        field: { id: 'f2', name: 'Priority', field_type: 'single_select', options: '["Critical","High","Normal","Low"]' },
        value: 'Critical',
      },
    ],
  },
};

export const EmptySidebar: Story = {
  args: {
    issue: {
      id: 'def456',
      status: 'todo',
      parent_issue_id: null,
      assignees: [],
      projects: [],
    },
    customFields: [],
  },
};
